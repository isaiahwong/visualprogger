/**
 * Created by Isaiah on 10/04/2017.
 */
$(function () {
	start();
});

function start() {
	/**	Initialise Graphics */
	init();
	animate();

	/** Establish Web Socket Stream */
	initSocket(visualiseProcess);

	/** Launch Page */
	launchPage();
}

function launchPage() {
	// Remove splash screen
	var $preload = $('#preload');
	var $main = $('.main');

	$preload.hide().remove();
	$main.show('slow');
}

var monthNames = ["January", "February", "March", "April", "May", "June",
	"July", "August", "September", "October", "November", "December"
];


/**
 * WEB SOCKET SETUP
 * @param {callback}
 */
var socket;

function initSocket(visualiseProcess) {
	socket = io();
	// socket.emit('scores');
	setTimeout(() => {
		socket.emit('scans');

		// Stream for scores
		socket.on('scores', function (data) {
			var array = JSON.parse(data);
			for (var i = 0; i < array.length; i++) {
				var id = array[i].procid;
				var name = array[i].procName;
				var scoreNum = array[i].score;
				var path = array[i].procPath;
				var rank = array[i].rank;

				var process = new Process();
				process.constructParam(id, name, scoreNum, rank, path);

				visualiseProcess(process);
			}
		});

		socket.on('scans', function (data) {
			var id = JSON.parse(data)[0];
			socket.emit('stream', id);
		});

		socket.on('stream', function (data) {
			const parsed = JSON.parse(data);
			const $time = $('.time');

			if (!parsed || !parsed.length) {
				return;
			}

			let counter = 0;

			const interval = setInterval(() => {
				try {
					// console.log(counter, parsed.length)
					if (counter === parsed.length) {
						clearInterval(interval);
					}

					if (!parsed[counter] || !parsed[counter].processes) {
						return;
					}

					var processArray = parsed[counter].processes;
					var time = parsed[counter]._id.split('-')[0];

					for (var i = 0; i < processArray.length; i++) {
						var id = processArray[i].procId;
						var name = processArray[i].procName;
						var path = processArray[i].procPath;
						var score = processArray[i].score;
						var rank = processArray[i].rank;

						var process = new Process();
						process.constructParam(id, name, score, rank, path);

						var date = new Date(time * 1000); // Convert UTC to standard time
						var readableDate = date.getDate() + ' ' + monthNames[date.getMonth()] + ' ' + date.getFullYear();

						$time.empty();
						$time.append(readableDate);

						if (processArray[i].libraries) process.copyLibrariesArray(processArray[i].libraries);
						if (processArray[i].traversals) process.copyTraversalsArray(processArray[i].traversals);
						if (processArray[i].encrypts) process.copyEncryptsArray(processArray[i].encrypts);

						visualiseProcess(process);
					}
					counter += 1;
				}
				catch (err) {
					console.log(err)
				} // Catch undefined length
			}, 1000);
		})
	}, 100);
}

/**
 * THREE JS SETUP
 * Using CSS Renderer and WebGL Renderer
 */

var camera, sceneGL, sceneCss, rendererGL, rendererCss, controls, stats, composer;

var mouse, raycaster;

var graphicContainer;

var audio;

const CIRCLE_SEGMENT = 80;

const DANGER = -1, NEW = 1, ACTIVITY = 2;

function init() {
	/** Camera */
	// Initialize THREEjs Camera
	camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 10000);
	camera.position.z = 3500;
	camera.position.y = 0;

	/** Get ID of div */
	graphicContainer = document.getElementById('graphic-container');

	/** Renderers */
	// GL Renderer
	rendererGL = new THREE.WebGLRenderer({ antialias: true });
	rendererGL.setSize(window.innerWidth, window.innerHeight);
	rendererGL.setClearColor(0x06071C, 1);
	rendererGL.domElement.style.zIndex = 5;
	graphicContainer.appendChild(rendererGL.domElement);

	// CSS3D Renderer
	rendererCss = new THREE.CSS3DRenderer();
	rendererCss.setSize(window.innerWidth, window.innerHeight);
	rendererCss.domElement.style.position = 'absolute';
	rendererCss.domElement.style.top = 0;
	rendererCss.domElement.className = 'cssRenderer';
	graphicContainer.appendChild(rendererCss.domElement);

	/** Scenes */
	// GL Scene
	sceneGL = new THREE.Scene();

	// CSS3D Scene
	sceneCss = new THREE.Scene();

	/** Click Controls */
	mouse = new THREE.Vector2();
	raycaster = new THREE.Raycaster();

	document.addEventListener('mousemove', onDocumentMouseMove, false);
	document.addEventListener('touchstart', onDocumentTouchStart, false);
	document.addEventListener('mousedown', onDocumentMouseDown, false);


	/** Camera Controls */
	controls = new THREE.OrbitControls(camera);
	controls.rotateSpeed = 0.5;
	controls.minDistance = 500;
	controls.maxDistance = 6000;

	/** Start Graphics */
	//draw();
	// composer = compose();
	drawVisual();


	/** Set up audio */
	initAudio();

	/** Initialize Stats */
	stats = new Stats();
	stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom

	// Align top-right
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.top = '0';
	stats.domElement.className = 'stats';
	// graphicContainer.appendChild(stats.domElement);

	// Resize renderers when page is changed
	window.addEventListener('resize', onWindowResize, false);
}

/**
 * Renders all renderers
 */
function render() {
	rendererCss.render(sceneCss, camera);
	rendererGL.render(sceneGL, camera);
	// composer.render();
}

/**
 * Change the page aspect ratio and size based on user's browser
 */
function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	rendererGL.setSize(window.innerWidth, window.innerHeight);
	rendererCss.setSize(window.innerWidth, window.innerHeight);

	render();
}

function animate() {
	requestAnimationFrame(animate);
	// stats.begin();

	// Monitored code goes here
	TWEEN.update();
	render();
	controls.update();
	// stats.end();
}

function initAudio() {
	audio = new Audio('/audio/click.ogg');
}

/** THREE JS VISUALISATION */
var bars = [];
var raycasterObjects = [];
var layerObjects = [];

/** Score Circle */
var scoreCircle;

/**
 * Draws the score circle
 */
function draw() {
	scoreCircle = drawCircleGeometry(300, 0x000000, 1, 0, 100, -500, '', 80, false);
	// Draw the bottom layer
	var circle2 = drawCircleGeometry(300, 0x000000, 1, 0, 100, -530, '', 80, false).circle;

	var circle = scoreCircle.circle;

	sceneGL.add(circle);
	sceneGL.add(circle2);

	// Draw ScoreBar
	while (drawScoreBar() == 1) { }
}

var middleBlackCircle, firstRing, secondRing, thirdRing, indicatorRing;

var cssConsole;

var innerLineSuite = [];

/**
 * Starting point of drawing grpahics
 * Coordinates for black process
 * X coordinates starts at -1500
 * Y coordinates starts at
 */
function drawVisual() {
	// Draw a process representation
	// var particle = drawSphere(15, 0x000000, -1500, 700, 0);

	/**
	 * 	Middle Black Circle
	 * 	Due to webgl's linewidth limitation, many lines are added to give a thick line
	 */
	middleBlackCircle = drawSphere(120, 0x8f8f99, 0, 0, 0, '');
	middleBlackCircle.circle.material.transparent = true;
	middleBlackCircle.circle.material.opacity = 0.2;

	indicatorRing = drawThickCircle(120, 361, 0, 0, 0, 15, 0xffffff, 1, 'indicator');

	// Inner thin line
	innerLineSuite.push(drawCircleBorder(130, 361, 0, 0, 0, '', 0xffffff, 0.5, 20).circle);
	innerLineSuite.push(drawCircleBorder(135, 361, 0, 0, 0, '', 0xffffff, 0.5, 20).circle);

	drawCircleBorder(155, 60, 0, 0, 0, '', 0xffffff, 0.8, 15, 45);
	drawCircleBorder(145, 70, 0, 0, 0, '', 0xffffff, 0.5, 15, 80);
	drawCircleBorder(155, 120, 0, 0, 0, '', 0xffffff, 0.8, 15, 120);
	drawCircleBorder(145, 60, 0, 0, 0, '', 0xffffff, 0.5, 15, 170);
	drawCircleBorder(145, 100, 0, 0, 0, '', 0xffffff, 0.8, 15, 235);
	drawCircleBorder(155, 38, 0, 0, 0, '', 0xffffff, 0.5, 15, 325);
	drawCircleBorder(145, 40, 0, 0, 0, '', 0xffffff, 0.8, 15, 5);

	// 3rd Ring
	firstRing = drawCircleBorder(380, 361, 0, 0, 0, '', 0xffffff, 1, 20);
	firstRing.copyThickCircles(drawThickCircle(380, 361, 0, 0, 0, 8, 0xffffff, 1, 'process'));
	firstRing.addThickCircles(drawIntersectingCircles(380, 'process', 0.1));

	// Inner thin line
	drawCircleBorder(375.0, 361, 0, 0, 0, '', 0xffffff, 0.5, 20);
	drawCircleBorder(370.0, 361, 0, 0, 0, '', 0xffffff, 0.2, 20);
	drawCircleBorder(365.0, 361, 0, 0, 0, '', 0xffffff, 0.2, 20);
	drawCircleBorder(360.0, 361, 0, 0, 0, '', 0xffffff, 0.5, 20);


	// 2nd Ring
	secondRing = drawCircleBorder(680, 361, 0, 0, 0, '', 0xffffff, 1, 20);
	secondRing.copyThickCircles(drawThickCircle(680, 361, 0, 0, 0, 8, 0xffffff, 1, 'files'));
	secondRing.addThickCircles(drawIntersectingCircles(680, 'files', 0.1));

	// Inner thin line
	drawCircleBorder(670, 361, 0, 0, 0, '', 0xffffff, 0.5, 20);
	drawCircleBorder(500, 361, 0, 0, 0, '', 0xffffff, 0.5, 20);

	/** Draw Layers of rings */
	// 4th Outer Ring
	thirdRing = drawCircleBorder(920, 361, 0, 0, 0, '', 0xffffff, 1, 20);
	thirdRing.copyThickCircles(drawThickCircle(920, 361, 0, 0, 0, 8, 0xffffff, 1, 'libraries'));
	thirdRing.addThickCircles(drawIntersectingCircles(920, 'libraries', 0.1));

	// Inner Thin Line
	drawCircleBorder(918, 361, 0, 0, 0, '', 0xffffff, 0.5, 20);
	drawCircleBorder(910, 361, 0, 0, 0, '', 0xffffff, 0.5, 20);
	drawCircleBorder(900, 361, 0, 0, 0, '', 0xffffff, 0.5, 20);


	// Inner process lines
	drawLineArc();

	// Draw css console
	// drawCSSConsole();

	// Labels the different layers of the analysis
	drawLayerLabel();

	// connectLines(particle.circle, particle, middleBlackCircle, 1, 1, 0x000000);

	sceneGL.add(middleBlackCircle.circle);
	sceneGL.add(thirdRing.circle);
	sceneGL.add(firstRing.circle);

	// animateLine(particle.lineTable[0], particle.circle, 20);
}

var names = [
	'Libraries .',
	'Folders .',
	'Process .',
];

var coordinates = [
	940, 700, 400
];

/**
 * Labels layers
 */
function drawLayerLabel() {
	var wrapperObj = new CircleNode();
	var object = new THREE.Object3D();
	object.position.x = 0;

	wrapperObj.circle = object;

	for (var i = 0; i < 3; i++) {
		object.position.y = coordinates[i];
		drawCSSLabel(object, names[i], 0, 'layer-title no-padding center');
		sceneCss.add(object.label);
	}
}

function drawIntersectingCircles(radius, name, order) {
	var geometry = new THREE.CircleGeometry(radius, 80);
	var material = new THREE.MeshBasicMaterial({ color: 0x06071C });
	var circle = new THREE.Mesh(geometry, material);

	circle.renderOrder = order;

	circle.position = new THREE.Vector3(0, 0, 0);
	circle.name = name;

	material.transparent = true;
	material.opacity = 0;

	material.polygonOffset = true;
	material.depthTest = true;
	material.depthWrite = true;
	material.polygonOffsetFactor = -4;
	material.polygonOffsetUnits = 0;

	sceneGL.add(circle);
	layerObjects.push(circle);

	return circle;
}

var rotateArcArr = [];

function drawLineArc() {

	var startObject = thirdRing.circle;
	var radius = thirdRing.radius;

	for (var i = 0; i < 360; i++) {
		var geometry = new THREE.Geometry();

		var x = startObject.position.x + ((radius + 40) * Math.cos(toRadians(i)));
		var y = startObject.position.y + ((radius + 40) * Math.sin(toRadians(i)));
		var z = startObject.position.z;

		var eX = startObject.position.x + ((radius + 70) * Math.cos(toRadians(i)));
		var eY = startObject.position.y + ((radius + 70) * Math.sin(toRadians(i)));
		var eZ = startObject.position.z;


		geometry.vertices.push(
			new THREE.Vector3(x, y, z),
			new THREE.Vector3(eX, eY, eZ)
		);

		var material = new THREE.LineBasicMaterial({
			color: 0xffffff
		});

		material.transparent = true;
		material.opacity = 0.2;

		var line = new THREE.Line(geometry, material);
		sceneGL.add(line);
		rotateArcArr.push(line);
	}

}

function drawThickCircle(radius, resolution, pX, pY, pZ, thickness, color, opacity, name) {
	var lines = [];
	for (var i = 0; i < thickness; i++) {
		var border = drawCircleBorder(radius, resolution, pX, pY, pZ, '', color, opacity, 20).circle;
		border.name = name;
		lines.push(border);
		radius += 0.5;
	}

	return lines;
}

function drawThickSquare(width, pX, pY, pZ, thickness, color, angle) {
	for (var i = 0; i < thickness; i++) {
		sceneGL.add(drawSquare(width, pX, pY, pZ, color, angle).square);
		width += 0.5;
	}
}

var processArr = [];
var particleMap = {}; // CircleNodes

/**
 * Function to control all activity in the scene
 * @param {Process} process
 */
function visualiseProcess(process) {
	// Checks if process exists in map
	if (!(process.name in particleMap)) {
		drawCSSTitle(-2080, 850, 0, 'PROCESS TRACKED');
		addProcess(process);
		addScore(process);
		updateScore(process, true);
	}

	if (process.score) updateScore(process, false);
	if (process.libraries.length) drawLibraryAccess(process);
	if (process.traversals.length && process.encrypts.length === 0) drawTraversalAccess(process);
	if (process.encrypts.length) drawEncryption(process);
}

/**
 * Adds a process representation in to threejs scene
 * @param {Score} score
 * @returns {CircleNode} particle
 */
function addProcess(process) {
	var name = process.name;

	// Gets the previous y coordinate of particle
	var previousY = (typeof processArr[processArr.length - 1] !== 'undefined') ?
		processArr[processArr.length - 1].circle.position.y : 800;

	var particle = drawSphere(10, 0xffffff, -1800, previousY - 100, 0, name);

	var circle = particle.circle;
	var x = circle.position.x;
	var y = circle.position.y;
	var z = circle.position.z;

	var square = drawSquare(50, x, y - 35, z, 0xffffff, 45).square;
	sceneGL.add(square);

	particle.process = process;
	particle.border = square;

	// Maps the process name to the particle
	particleMap[name] = particle;
	processArr.push(particle);

	// Adds the process to threejs object
	circle.userData = process;

	// Add Label to the process
	drawCSSLabel(particle, capitalise(name), 320, 'label-title');

	raycasterObjects.push(circle);
	sceneCss.add(particle.label);
	sceneGL.add(circle);
	changeFavicon(NEW);

	// connectBezierCurve(particle.circle, particle, middleBlackCircle, 1, 1, 0x000000);
	// animateLine(particle.lineTable[0], particle.circle, 20);
}

function addScore(process) {
	var particle = particleMap[process.name];

	var x = particle.circle.position.x;
	var y = particle.circle.position.y;
	var z = particle.circle.position.z;

	var bar = drawRectangle(50, 25, 15, 0xffffff, x - 780, y, z + 10);
	particle.bar = bar;

	var scoreTag = document.createElement('p');
	scoreTag.innerHTML = process.score;
	scoreTag.className = 'update-score';

	var label = new THREE.CSS3DObject(scoreTag);
	label.position.x = x - 770;
	label.position.y = y - 40;
	label.position.z = z;

	particle.scoreTag = label;

	sceneGL.add(bar);
	sceneCss.add(label);
}

/**
 * RATIO score:scale | 1:20
 */
function updateScore(process, initial) {
	var particle = particleMap[process.name];
	particle.scoreTag.element.innerHTML = process.score;

	if (particle.process.score != process.score || initial) {
		particle.process.score = process.score;
		animateBar(particle.bar, process.score / 10, 50);
	}
}

/**
 * Animates the score bar
 * @param {BarScore} barScore
 */
function animateBar(bar, scale, width) {
	var total = scale + bar.scale.x

	new TWEEN.Tween(bar.scale)
		.to({ x: total }, 2000)
		.easing(TWEEN.Easing.Exponential.InOut)
		.start();

	var x = bar.position.x - (scale * width / 2);
	var y = bar.position.y;

	new TWEEN.Tween(bar.position)
		.to({ x: x, y: y }, 2000)
		.easing(TWEEN.Easing.Exponential.InOut)
		.start();
}

var libraries = {}; // Stores all the libraries
var traversals = {};

const ANGLE_INCREMENT = 1;
const ANGLE_INCREMENT_TRAVERSE = 1.5;

var angleLibrary = 0;
var tmpLineArr = [];
var libraryOffset = 35;
var traversalOffset = 18;

/**
 * Animates Library access by process
 */
function drawLibraryAccess(process) {
	// Retrieves the circle node form the particle map
	var particle = particleMap[process.name];
	var libraryNode;
	var toAdd = false;

	var lineSettings = speedControl(process.libraries.length);

	for (var i = 0; i < process.libraries.length; i++) {
		var lib = process.libraries[i];

		// Add a library if it does not exist in the hashmap
		if (!(lib.libName in libraries)) {
			if (angleLibrary % 360 == 0 && angleLibrary != 0) libraryOffset += 25;

			var radius = thirdRing.radius;
			var circle = thirdRing.circle;

			// Plot the circle's position
			var x = circle.position.x + ((radius - libraryOffset) * Math.cos(toRadians(angleLibrary)));
			var y = circle.position.y + ((radius - libraryOffset) * Math.sin(toRadians(angleLibrary)));
			var z = circle.position.z;

			// libraryNode = drawSphere(15, 0x000000, x, y, z, lib);

			libraryNode = drawSquare(10, x, y, z, 0xffffff, angleLibrary, lib);

			// Adds the libraries in the library map
			libraries[lib.libName.toLowerCase()] = libraryNode;

			toAdd = true;

			libraryNode.square.userData = lib;
			raycasterObjects.push(libraryNode.square);

			// Increment the angle
			angleLibrary += ANGLE_INCREMENT;
		}
		else { libraryNode = libraries[lib.libName]; toAdd = false } // Retrieve the library in the map

		// Animate the activity
		connectBezierCurve(particle.circle, particle, libraryNode, 1, 1, lineSettings.color, new Library());
		animateLine(particle.lineTable[particle.lineTable.length - 1], libraryNode.square, 20, toAdd);
		tmpLineArr.push(particle.lineTable[particle.lineTable.length - 1]);
	}


	var interval = setInterval(function () {
		if (tmpLineArr.length > 0) {
			sceneGL.remove(sceneGL.getObjectById(tmpLineArr[0].id));
			tmpLineArr.splice(0, 1);
		}
		else {
			clearInterval(interval);
		}
	}, lineSettings.speed);
}

var angleTraversal = 0;
var tmpLineArr2 = [];

/**
 * Animates Traversal access by process
 */
function drawTraversalAccess(process) {
	// Retrieves the circle node form the particle map
	var particle = particleMap[process.name];
	var traversalNode;
	var toAdd = false;

	var lineSettings = speedControl(process.traversals.length);

	// Retrieves all traversals access by the current process
	for (var i = 0; i < process.traversals.length; i++) {
		var traversal = process.traversals[i];
		var path = joinPath(traversal.dirName.toLowerCase(), traversal.parentName.toLowerCase()) + '\\';

		// Add a traversals if it does not exist in the hashmap
		if (!(path in traversals)) {
			if (angleTraversal % 360 == 0 && angleTraversal != 0) traversalOffset += 20;

			var radius = secondRing.radius;
			var circle = secondRing.circle;

			// Plot the circle's position
			var x = circle.position.x + ((radius - traversalOffset) * Math.cos(toRadians(angleTraversal)));
			var y = circle.position.y + ((radius - traversalOffset) * Math.sin(toRadians(angleTraversal)));
			var z = circle.position.z;

			traversalNode = drawSphere(5, 0xffffff, x, y, z, traversal);

			// Adds the traversals in the traversal map
			traversals[path] = traversalNode;

			toAdd = true;
			// Adds traversal to userData
			traversalNode.circle.userData = traversal;
			raycasterObjects.push(traversalNode.circle);

			// Increment the angle
			angleTraversal += ANGLE_INCREMENT_TRAVERSE;
		}
		else { traversalNode = traversals[path]; toAdd = false } // Retrieve the traversal in the map

		changeFavicon(ACTIVITY);
		// Animate the activity
		connectBezierCurve(particle.circle, particle, traversalNode, 1, 1, lineSettings.color, new Traversal());
		animateLine(particle.traversalLineTable[particle.traversalLineTable.length - 1], traversalNode.circle, 20, toAdd);
		tmpLineArr2.push(particle.traversalLineTable[particle.traversalLineTable.length - 1]);
	}

	var interval = setInterval(function () {
		if (tmpLineArr2.length > 0) {
			sceneGL.remove(sceneGL.getObjectById(tmpLineArr2[0].id));
			tmpLineArr2.splice(0, 1);
		}
		else {
			clearInterval(interval);
		}
	}, lineSettings.speed);
}

/**
 * Controls animation speed of lines
 * Note, raycasterObjects are passed by reference
 * @param length
 * @param speed
 * @param color
 */
function speedControl(length) {
	var color = 0x116ead;
	var speed;

	if (length < 15) { speed = 800; }
	else if (length < 25) { speed = 200; }
	else if (length < 50) { speed = 200; }
	else if (length < 100) { speed = 50; color = 0xf37d2c; }
	else { speed = 10; color = 0xf37d2c; }

	return new LineSettings(color, speed);
}

var update = true;

function drawEncryption(process) {
	var particle = particleMap[process.name];
	var name = process.name;
	/**
	 * 	Animate changing of color
	 */
	if (update) {
		console.log('ENCYRPTION');
		changeFavicon(DANGER);
		console.log(name);
		changeIndication();
		changeColor(particle, function (particle) {
			// Change Circle Color
			particle.circle.material.color.setHex(0xff0000);
			// Change Border Color
			particle.border.material.color.setHex(0xff0000);
			// Change bar Color
			particle.bar.material.color.setHex(0xff0000);
			// Change text color
			particle.scoreTag.element.className = 'update-score red';
			particle.label.element.className = 'label-title red';
		});
	}

	drawScoreBoard(process);

	update = false;

	for (var i = 0; i < process.encrypts.length; i++) {
		var encrypt = process.encrypts[i];
		// Combines the file path into one
		var filePath = extractPath(encrypt.filePath);

		if (filePath in traversals) {
			var traversalNode = traversals[filePath];
			changeColor(traversalNode, function (traversalNode) {
				traversalNode.circle.material.color.setHex(0xff0000);
			});

			traversalNode.circle.userData.addFile(encrypt);

			connectBezierCurve(particle.circle, particle, traversalNode, 1, 1, 0xff0000, new Traversal());
			animateLine(particle.traversalLineTable[particle.traversalLineTable.length - 1], traversalNode.circle, 20, false);
		}
	}
}

function changeIndication() {
	for (var i = 0; i < indicatorRing.length; i++) {
		sceneGL.remove(sceneGL.getObjectById(indicatorRing[i].id));
		middleBlackCircle.circle.material.color.setHex(0xff0000);
		drawThickCircle(120, 361, 0, 0, 0, 15, 0xff0000, 1);
	}

}

var onClickObjects = [];

function drawScoreBoard(process) {
	var outerRing = document.createElement('div');
	outerRing.className = 'outer-ring';

	var score = document.createElement('div');
	score.className = 'main-score';
	outerRing.appendChild(score);

	var number = document.createElement('span');
	number.className = 'number';
	number.innerHTML = process.score;
	score.appendChild(number);

	var object = new THREE.CSS3DObject(outerRing);

	object.position.x = 0;
	object.position.y = 0;

	var heading = document.createElement('div');
	heading.className = 'selected-heading';

	var innerRing = document.createElement('div');
	innerRing.className = 'inner-ring';
	heading.appendChild(innerRing);

	var name = document.createElement('span');
	name.className = 'process-name';
	name.innerHTML = process.name;

	var object2 = new THREE.CSS3DObject(heading);

	object2.position.x = 230;
	object2.position.y = 0;

	object2.rotation.z = toRadians(45);

	var object3 = new THREE.CSS3DObject(name);
	object3.position.x = 230;
	object3.position.y = 0;

	removeCssObject(onClickObjects);

	sceneCss.add(object);
	sceneCss.add(object2);
	sceneCss.add(object3);

	onClickObjects.push(object);
	onClickObjects.push(object2);
	onClickObjects.push(object3);
}

function changeColor(circleNode, onCompleteFunc) {
	// Reduce opacity of the process
	new TWEEN.Tween(circleNode.circle.material)
		.to({ opacity: 0 }, 1000)
		.easing(TWEEN.Easing.Exponential.InOut)
		.start()
		.onComplete(function () {
			if (onCompleteFunc) onCompleteFunc(circleNode);
		});

	// Increase the opacity of the process
	new TWEEN.Tween(circleNode.circle.material)
		.to({ opacity: 1 }, 1000)
		.easing(TWEEN.Easing.Exponential.InOut)
		.start();
}

function joinPath(name, path) {
	return path + name;
}

function extractPath(path) {
	var strArr = path.split('\\');

	for (var i = 0; i < strArr.length; i++) {
		strArr[i] = strArr[i].toLowerCase();
	}
	return strArr.slice(0, strArr.length - 1).join('\\') + '\\';
}

function extractFileName(path) {
	var strArr = path.split('\\');
	return strArr[strArr.length - 1];
}
//
// const MAX_PROCESS = 10;
// var scoreBarArr = [];
// var scoreArr = [];
// var scoreMap = {};
//
// var width = 50, height = 20, depth = 1;
//
// function drawScoreBar() {
// 	var rY = 45;
// 	var angle = 0;
//
// 	var radius = scoreCircle.radius;
// 	var circle = scoreCircle.circle;
//
// 	if(scoreBarArr.length < 1) angle = 0;
// 	// Get the last angle
// 	else angle += scoreBarArr[scoreBarArr.length - 1].angle;
//
// 	angle += 45;
// 	if(angle > 360) return 0;
//
// 	// Rotates the bar to its 45 degree angle pointing out
// 	if (angle == 45 || angle == 225) rY = 135;
// 	else if(angle % 180 == 0) rY = 90;
// 	else if(angle % 90 == 0) rY = 0;
// 	else if(angle % 45 == 0) rY = 45;
//
// 	// Plots each bar on 45 degree angle on the edge of the circle
// 	var x = circle.position.x + ((radius + depth/2) * Math.cos(toRadians(angle)));
// 	var y = circle.position.y + ((radius + depth/2) * Math.sin(toRadians(angle)));
// 	var z = circle.position.z - height/2;
//
// 	// construct a barscore object
// 	var barScore = drawBoxGeometry(width, height, depth, 0x000000, x, y, z, '', toRadians(rY));
//
// 	// Stores the angle in the bar object
// 	barScore.angle = angle;
//
// 	sceneGL.add(barScore.bar);
// 	scoreBarArr.push(barScore);
// 	return 1;
// }

/**
 *
 * @param radius
 * @param resolution
 * @param pX
 * @param pY
 * @param pZ
 * @param color
 * returns {CircleNode}
 */
function drawCircleBorder(radius, resolution, pX, pY, pZ, name, color, opacity, animationSpeed, startAngle) {
	var circleNode = new CircleNode();

	var x, y, z;

	var geometry = new THREE.BufferGeometry();
	var material = new THREE.LineDashedMaterial({
		color: color,
		dashSize: 1, // to be updated in the render loop
		gapSize: 1e10 // a big number, so only one dash is rendered
	});

	material.transparent = true;
	material.opacity = opacity;

	var points = [];
	var pointsLength = 0;
	var angle;

	// Plot the points of the circle;
	for (var i = 0; i < resolution; i++) {
		// Set i as the angle;
		if (startAngle) angle = startAngle++;
		else angle = i;

		// Plot the x y coordinates
		x = radius * Math.cos(toRadians(angle));
		y = radius * Math.sin(toRadians(angle));
		z = 0;

		points.push(new THREE.Vector3(x, y, z));
	}

	// Get the number of points
	pointsLength = points.length;
	var positions = new Float32Array(pointsLength * 3); // 3 vertices per point
	var lineDistances = new Float32Array(pointsLength * 1); // 1 value per point

	geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
	geometry.addAttribute('lineDistance', new THREE.BufferAttribute(lineDistances, 1));

	for (var i = 0, index = 0; i < pointsLength; i++ , index += 3) {
		positions[index] = points[i].x;
		positions[index + 1] = points[i].y;
		positions[index + 2] = points[i].z;

		if (i > 0) {
			lineDistances[i] = lineDistances[i - 1] + points[i - 1].distanceTo(points[i]);
		}
	}

	var lineLength = lineDistances[pointsLength - 1];

	var circle = new THREE.Line(geometry, material);
	circle.lineLength = lineLength;

	// Position
	circle.position.x = pX;
	circle.position.y = pY;
	circle.position.z = pZ;

	circleNode.circle = circle;
	circleNode.radius = radius;
	circleNode.name = name;

	sceneGL.add(circle);

	animateLine(circle, null, animationSpeed, true);

	return circleNode;
}

/**
 * Join lines from one point to the other
 * First Circle would be the smaller circle
 * @param firstCircle {Object}
 * @param secondCircle {Object}
 */
function connectBezierCurve(circle, circleNodeStart, circleNodeEnd, angle, eAngle, color, instance) {
	var circleEnd;

	if (circleNodeEnd instanceof CircleNode) circleEnd = circleNodeEnd.circle;
	else if (circleNodeEnd instanceof SquareNode) circleEnd = circleNodeEnd.square;
	else circleNodeEnd

	const radiusTwo = circleNodeEnd.radius;

	let x, y, z; // Starting Coordinates
	let eX, eY, eZ; // Ending Coordinates

	/**
	 * 	Gets the position of the circle
	 * 	X Coordinates = radius * cos(angle)
	 * 	Y Coordinates = radius * sin(angle)
	 */
	// Start Point
	x = circle.position.x;
	y = circle.position.y;
	z = circle.position.z;

	// End Point
	if (circleNodeEnd instanceof CircleNode || circleNodeEnd instanceof SquareNode) {
		eX = circleEnd.position.x + (radiusTwo * Math.cos(toRadians(eAngle)));
		eY = circleEnd.position.y + (radiusTwo * Math.sin(toRadians(eAngle)));
		eZ = circleEnd.position.z;
	}
	else {
		eX = circleEnd.position.x - 300;
		eY = circleEnd.position.y + 100;
		eZ = circleEnd.position.z;
	}

	// console.log('x : ' + x);
	// console.log('y : ' + y);
	// console.log('z : ' + z);
	//
	// console.log('eX : ' + eX);
	// console.log('eY : ' + eY);
	// console.log('eZ : ' + eZ);

	/** Construct Bezier S Curve */
	// x y z
	var controlPointOne = (angle >= 180 && angle <= 360) ? y + 100 : y - 100;
	var controlPointTwo = (angle >= 180 && angle <= 360) ? y - 100 : y + 100;
	var curve;

	if (circleNodeEnd instanceof CircleNode)
		curve = new THREE.CubicBezierCurve3(
			new THREE.Vector3(x, y, z),
			new THREE.Vector3(x + 700, y, z),
			new THREE.Vector3(x + 500, y - 500, z),
			new THREE.Vector3(eX, eY, eZ)
		).getPoints(500);
	// Added more distance as square nodes are rotated
	else if (circleNodeEnd instanceof SquareNode)
		curve = new THREE.CubicBezierCurve3(
			new THREE.Vector3(x, y, z),
			new THREE.Vector3(x + 700, y, z),
			new THREE.Vector3(x + 500, y - 500, z),
			new THREE.Vector3(eX - 10, eY + 10, eZ)
		).getPoints(500);
	else
		curve = new THREE.CubicBezierCurve3(
			new THREE.Vector3(x, y, z),
			new THREE.Vector3(x + 700, y, z),
			new THREE.Vector3(x + 300, y + 800, z),
			new THREE.Vector3(eX, eY, eZ)
		).getPoints(500);

	var numPoints = curve.length;

	var geometry = new THREE.BufferGeometry();
	var positions = new Float32Array(numPoints * 3); // 3 vertices per point
	var lineDistances = new Float32Array(numPoints * 1); // 1 value per point

	geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
	geometry.addAttribute('lineDistance', new THREE.BufferAttribute(lineDistances, 1));

	for (var i = 0, index = 0; i < numPoints; i++ , index += 3) {
		positions[index] = curve[i].x;
		positions[index + 1] = curve[i].y;
		positions[index + 2] = curve[i].z;

		if (i > 0) {
			lineDistances[i] = lineDistances[i - 1] + curve[i - 1].distanceTo(curve[i]);
		}
	}

	var lineLength = lineDistances[numPoints - 1];

	var material = new THREE.LineDashedMaterial({
		color: color,
		dashSize: 1, // to be updated in the render loop
		gapSize: 1e10 // a big number, so only one dash is rendered
	});

	material.transparent = true;
	material.opacity = 0.6;

	var line = new THREE.Line(geometry, material);
	line.lineLength = lineLength;

	// Stores the curve and line vertices in an array to be used later on for plotting
	(instance instanceof Library) ? circleNodeStart.addCurveLinePair(curve, line) : circleNodeStart.addTraversalLine(line);
	sceneGL.add(line);

	/**
	 * Stores the values in Circle Node
	 */
	circleNodeStart.angle = angle;
	circleNodeStart.eAngle = eAngle;

	// The end angle is the start angle for node two
	circleNodeEnd.angle = eAngle;
}


/**
 * Temp line for label
 */
function connectDottedBezierCurve(startObject, endObject, angle, radius, color) {
	let x, y, z; // Starting Coordinates
	let eX, eY, eZ; // Ending Coordinates

	var curve;

	x = startObject.position.x + (radius * Math.cos(toRadians(angle)));
	y = startObject.position.y + (radius * Math.sin(toRadians(angle)));
	z = startObject.position.z;

	eX = endObject.position.x - 300;
	eY = endObject.position.y + 100;
	eZ = endObject.position.z;

	curve = new THREE.CubicBezierCurve3(
		new THREE.Vector3(x, y, z),
		new THREE.Vector3(x + 700, y, z),
		new THREE.Vector3(x + 500, y - 500, z),
		new THREE.Vector3(eX, eY, eZ)
	).getPoints(500);

	return line;
}


/**
 * Animate line drawings
 * default 20
 * @param line
 * @param threeObject
 * @param toAdd | When animation ends, add a threeObject
 */
function animateLine(line, threeObject, speed, toAdd) {
	var fraction = 0;
	line.material.initial = line.material.dashSize;

	var interval = setInterval(function () {
		try {
			if (fraction < 1.1) {
				fraction += 0.01;
				line.material.dashSize = fraction * line.lineLength;
			}
			else {
				// When the animation has ended, Add the circles)
				if (threeObject != null && toAdd) {
					if (!(threeObject instanceof THREE.CSS3DObject)) {
						sceneGL.add(threeObject);
					}
				}

				clearInterval(interval);
			}
		}
		catch (err) {
			clearInterval(interval);
		}
	}, speed);
}


/**
 * Animates the score bar
 * @param {BarScore} barScore
 */
function animateScoreBar(barScore, scale) {
	var angle = barScore.angle;
	var bar = barScore.bar;

	var total = scale + bar.scale.z;

	new TWEEN.Tween(bar.scale)
		.to({ z: total }, 2000)
		.easing(TWEEN.Easing.Exponential.InOut)
		.start();

	var x = bar.position.x + ((scale * depth / 2) * Math.cos(toRadians(angle)));
	var y = bar.position.y + ((scale * depth / 2) * Math.sin(toRadians(angle)));

	new TWEEN.Tween(bar.position)
		.to({ x: x, y: y }, 2000)
		.easing(TWEEN.Easing.Exponential.InOut)
		.start();
}

const ratio = 20;
let index = 0;
/**
 * MAX SCORE = 25;
 * MAX SCALE = 500;
 * RATIO score:scale | 1:20
 * @param score
 * @returns {Number} scale
 */
function checkScore(score) {
	// Sorts the score array in ascending order
	scoreArr.sort(function (a, b) {
		return b.score - a.score;
	});

	// Ensures that scoreArr does not exceed the max process
	if (scoreArr.length == MAX_PROCESS) {
		// Check if the new process score is bigger than the smallest process
		if (scoreArr[0].score < score.score) {
			// Replaces the old process score name with the new process score name
			var key = scoreArr[0].name;
			scoreMap[score.name] = scoreMap[key];
			delete scoreMap[key];

			// Replace the old process score object with the new score object
			scoreArr[0] = score;

			// Reanimate
			animateScoreBar(scoreMap[score.name], ratio * score.score);
		}
	}
	else {
		// Retrieve the Bar raycasterObjects
		var bar = scoreBarArr[index];

		scoreArr.push(score);

		// Maps the process name with the bar
		scoreMap[score.name] = bar;

		animateScoreBar(bar, ratio * score.score);
		index++;
	}
}

/**
 * Draw ring of a circle
 * @param radius
 * @param color
 * @param opacity
 * @param pX
 * @param pY
 * @param pZ
 * @param name
 * @param segments
 * @param mesh
 * @returns {CircleNode}
 */
function drawCircleGeometry(radius, color, opacity, pX, pY, pZ, name, segments, mesh) {
	var circleNode = new CircleNode();
	var circle;

	var geometry = new THREE.CircleGeometry(radius, segments);
	// Remove center vertex
	geometry.vertices.shift();

	var material = new THREE.LineBasicMaterial({
		color: color,
		side: THREE.DoubleSide
	});

	material.transparent = true;
	material.opacity = opacity;

	// Create new shape based on the vertices created
	if (mesh) {
		circle = new THREE.Mesh(geometry, material);
	}
	else {
		circle = new THREE.Line(geometry, material);
	}
	circle.position.x = pX;
	circle.position.y = pY;
	circle.position.z = pZ;

	// circle.rotation.x = Math.PI / 2;

	// Stores values in Circle Node
	circleNode.radius = radius;
	circleNode.circle = circle;
	circleNode.name = name;

	return circleNode;
}

/**
 * @param radius
 * @param color
 * @param pX
 * @param pY
 * @param pZ
 * @returns {CircleNode}
 */
function drawSphere(radius, color, pX, pY, pZ, object) {
	var circleNode = new CircleNode();

	var geometry = new THREE.SphereGeometry(radius, 50, 50, 0, Math.PI * 2, 0, Math.PI * 2);
	var material = new THREE.MeshBasicMaterial({ color: color });

	var sphere = new THREE.Mesh(geometry, material);

	sphere.position.x = pX;
	sphere.position.y = pY;
	sphere.position.z = pZ;

	// Stores values in Circle Node
	circleNode.radius = radius;
	circleNode.circle = sphere;
	circleNode.object = object;

	return circleNode;
}

function drawSquare(width, pX, pY, pZ, color, angle, object) {
	var squareNode = new SquareNode();

	var geometry = new THREE.Geometry();

	geometry.vertices.push(new THREE.Vector3(0, 0, 0));
	geometry.vertices.push(new THREE.Vector3(0, width, 0));
	geometry.vertices.push(new THREE.Vector3(width, width, 0));
	geometry.vertices.push(new THREE.Vector3(width, 0, 0));
	geometry.vertices.push(new THREE.Vector3(0, 0, 0));

	var material = new THREE.LineBasicMaterial({ color: color });

	var square = new THREE.Line(geometry, material);
	square.position.x = pX;
	square.position.y = pY;
	square.position.z = pZ;

	square.rotation.z = toRadians(angle);

	// Stores values in Square Node
	squareNode.radius = width;
	squareNode.square = square;
	squareNode.object = object;

	return squareNode;
}

function drawRectangle(width, height, depth, color, pX, pY, pZ) {
	var boxGeometry = new THREE.BoxGeometry(width, height, depth);
	var material = new THREE.MeshBasicMaterial({ color: color });

	var bar = new THREE.Mesh(boxGeometry, material);

	bar.position.x = pX;
	bar.position.y = pY;
	bar.position.z = pZ;

	return bar;
}

function drawBoxGeometry(width, height, depth, color, pX, pY, pZ, name, rY) {
	// Create Box Geometry vetices
	var boxGeometry = new THREE.BoxGeometry(width, height, depth);
	// Outline the Box Geometry
	var geometry = new THREE.EdgesGeometry(boxGeometry);

	//create a material
	var material = new THREE.LineBasicMaterial({
		color: color,
	});

	var bar = new THREE.LineSegments(geometry, material);

	bar.position.x = pX;
	bar.position.y = pY;
	bar.position.z = pZ;

	// bar.rotation.x = Math.PI/2;
	// bar.rotation.y = rY;

	// return bar geometry
	return new BarScore(bar, name);
}

var onScreenFolder = [];

/**
 * Creates a CSS Object representation of library node
 */
function drawCSSFolder(data) {
	var name, path, files;

	console.log(data);

	switch (data.constructor) {
		case Traversal:
			name = data.dirName;
			path = data.parentName;
			files = data.files;
			break;
		case Library:
			name = data.libName;
			path = data.libPath;
	}

	var libraryNode = document.createElement('div');
	libraryNode.className = 'folder-node';

	var titleWrap = document.createElement('div');
	titleWrap.className = 'title-wrap';
	libraryNode.appendChild(titleWrap);

	var title = document.createElement('p');
	title.className = 'title';
	title.innerHTML = name;
	titleWrap.appendChild(title);


	var detailsWrap = document.createElement('ul');
	detailsWrap.className = 'details-wrap';
	detailsWrap.innerHTML = path;
	libraryNode.appendChild(detailsWrap);

	//file
	if (typeof files !== 'undefined')
		for (var i = 0; i < files.length; i++) {
			var bar = document.createElement('li');
			bar.className = 'details';
			bar.innerHTML = extractFileName(files[i].filePath);
			detailsWrap.appendChild(bar);
		}


	var object = new THREE.CSS3DObject(libraryNode);
	object.position.x = 1500;
	object.position.y = middleBlackCircle.circle.position.y;

	removeCssObject(onScreenFolder);
	sceneCss.add(object);

	onScreenFolder.push(object);

	return object;
}

/**
 * Draw Css console
 */
function drawCSSConsole() {
	var console = document.createElement('div');
	console.className = 'console';

	drawCSSTitle(1350, -250, 0, 'LOGS');

	cssConsole = new THREE.CSS3DObject(console);
	cssConsole.position.x = 1700;
	cssConsole.position.y = -500;

	sceneCss.add(cssConsole);
}

function removeCssObject(objects) {
	if (objects.length)
		for (var i = 0; i < objects.length; i++) {
			sceneCss.remove(sceneCss.getObjectById(objects[i].id));
		}
	else
		sceneCss.remove(sceneCss.getObjectById(objects.id));
}

/**
 * Draws a label
 * @param {CircleNode} bindObjectNode | Binds the label to an object
 * @param {String} name
 */
function drawCSSLabel(bindObjectNode, name, offset, customClass) {
	var bindObject = (typeof bindObjectNode.circle != 'undefined') ? bindObjectNode.circle : bindObjectNode;

	var label = document.createElement('div');
	label.className = customClass;
	label.innerHTML = name;

	var object = new THREE.CSS3DObject(label);
	object.position.x = bindObject.position.x - offset;
	object.position.y = bindObject.position.y;
	object.position.z = bindObject.position.z;

	bindObjectNode.label = object;

	return object;
}

function drawCSSTitle(pX, pY, pZ, name) {
	var title = document.createElement('span');
	title.className = 'group-heading';
	title.innerHTML = name;


	var object = new THREE.CSS3DObject(title);
	object.position.x = pX;
	object.position.y = pY;
	object.position.z = pZ;

	sceneCss.add(object);
}

function onDocumentTouchStart(event) {
	event.preventDefault();

	event.clientX = event.touches[0].clientX;
	event.clientY = event.touches[0].clientY;
	onDocumentMouseMove(event);

}

var INTERSECTED;
var ARC;

function onDocumentMouseMove(event) {
	setUpRaycaster(event);

	initLayerRaycaster();

	var intersects = raycaster.intersectObjects(raycasterObjects);

	if (intersects.length > 0) {
		INTERSECTED = intersects[0].object;

		/**
		 * BAD CODE. REMEMBER TO REFACTOR
		 * Filters the layers
		 */
		INTERSECTED.scale.set(1.5, 1.5, 1.5);
		// (name.length > 1) ? changeColorLayer(name, INTERSECTED) : ;

		audio.play();
	}
	else { // No interaction
		// Resets all scale
		for (var i = 0; i < raycasterObjects.length; i++) {
			try {
				raycasterObjects[i].scale.set(1, 1, 1);
				// raycasterObjects[i].material.color.setHex(0xffffff);
			}
			catch (err) { }
		}

		INTERSECTED = null;
	}
}

function onDocumentMouseDown(event) {
	setUpRaycaster(event);

	var intersects = raycaster.intersectObjects(raycasterObjects);

	if (intersects.length > 0) {
		INTERSECTED = intersects[0].object;
		showObject(INTERSECTED);
	}
	else { // No interaction
		INTERSECTED = null;
	}
}

function initLayerRaycaster() {
	var libLayer = raycaster.intersectObjects(thirdRing.thickCircles);
	var fileLayer = raycaster.intersectObjects(secondRing.thickCircles);
	var processLayer = raycaster.intersectObjects(firstRing.thickCircles);

	changeColorLayer(libLayer, thirdRing.thickCircles);
	changeColorLayer(fileLayer, secondRing.thickCircles);
	changeColorLayer(processLayer, firstRing.thickCircles);
}

function changeColorLayer(intersect, objects) {
	if (intersect.length > 0) {
		for (var i = 0; i < objects.length; i++) {
			objects[i].material.color.setHex(0xff0000);
		}
	}
	else {
		if (objects.length) {
			for (var i = 0; i < objects.length; i++) {
				objects[i].material.color.setHex(0xffffff);
			}
		}
	}
}

/**
 *
 * @param object
 */
function showObject(object) {
	var data = object.userData;

	switch (data.constructor) {
		case Process:
			reanimateLines(object);
			drawScoreBoard(data);
			break;
		case Traversal: case Library:
			drawCSSFolder(data, object.position);
			break;
	}
}
var lineCache = [];

function reanimateLines(object) {
	var particle = particleMap[object.userData.name];

	for (var i = 0; i < lineCache.length; i++) {
		sceneGL.remove(sceneGL.getObjectById(lineCache[i].id));
	}

	for (var i = 0; i < particle.lineTable.length; i++) {
		var line = particle.lineTable[i];

		lineCache.push(line);
		sceneGL.add(line);

		animateLine(line, null, 20, false);
	}
}


function setUpRaycaster(event) {
	event.preventDefault();

	mouse.x = (event.clientX / rendererGL.domElement.width) * 2 - 1;
	mouse.y = - (event.clientY / rendererGL.domElement.height) * 2 + 1;

	// console.log('X | ' + mouse.x);
	// console.log('Y | ' + mouse.y);

	raycaster.setFromCamera(mouse, camera);
}

/**
 * Converts degrees to radians
 * @param angle {Number}
 */
function toRadians(angle) {
	return angle * Math.PI / 180;
}

function capitalise(str) {
	return str.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
}

var isDanger = false;

function changeFavicon(type) {
	var link = document.querySelector('link[rel*=\'icon\']') || document.createElement('link');
	var href;

	link.type = 'image/x-icon';
	link.rel = 'shortcut icon';

	if (!isDanger)
		switch (type) {
			case 0:
				href = 'favicon.ico';
				break;
			case NEW:
				href = 'favicon-g.ico';
				break;
			case ACTIVITY:
				href = 'favicon-b.ico';
				break;
			case DANGER:
				href = 'favicon-r.ico';
				isDanger = true;
				break;
		}

	link.href = href;
	document.head.appendChild(link);
}
