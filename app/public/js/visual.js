/**
 * Created by Isaiah :D on 28/03/2017.
 */
function initVisualisation(process) {
	// Draw the first circle in the model
	drawProcess(process);
	
	// circleArray.push(drawCircleGeometry(15, 1, 0x5fae9d, 0, 10, 12, 'files'));
	// circleArray.push(drawCircleGeometry(10, 1, 0x5fae9d, 0, 10, 3, 'folders'));
	// circleArray.push(drawCircleGeometry(5, 1, 0x5fae9d, 0, 10, -12, 'libraries'));
	//
	// addCircleToScene(circleArray[0].circle);
	// addCircleToScene(circleArray[1].circle);
	// addCircleToScene(circleArray[2].circle);
	//
	// let angle = 235, eAngle = 225;
	//
	// // Draw circles
	// for(var i = 0; i < 30; i++) {
	// 	drawChildCircles(circleArray[1], angle);
	// 	// Increment angle for changing of positions
	// 	connectLines(circleArray[1].childCircles[i], circleArray[1], circleArray[0], angle, eAngle);
	// 	drawLine(circleArray[1].lineTable[i]);
	// 	angle += 10;
	// 	eAngle += 10;
	// }
}
/**
 * x, y, z
 * From loW to high
 */
const points = [
	0, 10, -15,
	0, 10, -6,
	0, 10, 3,
	0, 10, 12,
];

var circleArray = []; // Stores array of circles
var lineLength;
var intervalsArray = [];

/**
 * @param radius {	Number}
 * @param linewidth {Number}
 * @param pX {Number}
 * @param pY {Number}
 * @param pZ {Number}
 * @param name {String}
 * @returns {CircleNode}
 */
function drawCircleGeometry(radius, color, opacity, pX, pY, pZ, name, segments, mesh) {
	var circleNode = new CircleNode();
	var circle;
	
	var geometry = new THREE.CircleGeometry( radius, segments );
	// Remove center vertex
	geometry.vertices.shift();
	
	var material = new THREE.LineBasicMaterial({
		color: color
	});
	
	material.transparent = true;
	material.opacity = opacity;
	
	// Create new shape based on the vertices created
	if(mesh) {
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

function addCircleToScene(circle) {
	sceneGL.add(circle);
}

/**
 * Positions the circle to the circumference of a parent circle
 * @param circleNode {CircleNode}
 */
function drawChildCircles(circleNode, angle, object, elevation, color, opacity) {
	var name, path;
	var radius = circleNode.radius;
	var circle = circleNode.circle;
	
	var x = circle.position.x + (radius * Math.cos(toRadians(angle)));
	var y = circle.position.y + (radius * Math.sin(toRadians(angle)));
	var z = circle.position.z + elevation;
	
	if(object instanceof Traversal) {
		name = object.dirName;
		path = object.parentName+object.dirName+'\\';
	}
	else if (object instanceof Library) {
		name = object.libName;
		path = object.libPath;
	}
	
	var childCircle = drawCircleGeometry(50, color, opacity, x, y, z, name, 5, false).circle;
	
	var childCircleData = new ChildCircleData(name, path);
	
	// Stores data into each node
	childCircle.userData = childCircleData;
	childCircle.angle = angle;
	
	circleNode.addChildCircle(childCircle);
	
	return childCircle;
}

/**
 * Join lines from one point to the other
 * First Circle would be the smaller circle
 * @param firstCircle {Object}
 * @param secondCircle {Object}
 */
function connectLines(circle, circleNodeStart, circleNodeEnd, angle, eAngle) {
	let circleEnd = circleNodeEnd.circle;
	
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
	eX = circleEnd.position.x + (radiusTwo * Math.cos(toRadians(eAngle)));
	eY = circleEnd.position.y + (radiusTwo * Math.sin(toRadians(eAngle)));
	eZ = circleEnd.position.z;
	
	// console.log('x : ' + x);
	// console.log('y : ' + y);
	// console.log('z : ' + z);
	//
	// console.log('eX : ' + eX);
	// console.log('eY : ' + eY);
	// console.log('eZ : ' + eZ);
	
	/** Construct Bezier S Curve */
	// x y z
	var controlPointOne = (angle >= 180 && angle <= 360 ) ? y+100 : y-100;
	var controlPointTwo = (angle >= 180 && angle <= 360 ) ? y-100 : y+100;
	
	
	var curve = new THREE.CubicBezierCurve3(
		new THREE.Vector3(x, y, z),
		new THREE.Vector3(x, controlPointOne, z+40),
		new THREE.Vector3(x, controlPointTwo, z+40),
		new THREE.Vector3(eX, eY, eZ)
	).getPoints(500);
	
	var numPoints = curve.length;
	
	var geometry = new THREE.BufferGeometry();
	var positions = new Float32Array( numPoints * 3 ); // 3 vertices per point
	var lineDistances = new Float32Array( numPoints * 1 ); // 1 value per point
	
	geometry.addAttribute( 'position', new THREE.BufferAttribute(positions, 3));
	geometry.addAttribute( 'lineDistance', new THREE.BufferAttribute(lineDistances, 1));
	
	for ( var i = 0, index = 0;  i < numPoints; i ++, index += 3 ) {
		positions[ index ] = curve[ i ].x;
		positions[ index + 1 ] = curve[ i ].y;
		positions[ index + 2 ] = curve[ i ].z;
		
		if ( i > 0 ) {
			lineDistances[ i ] = lineDistances[ i - 1 ] + curve[ i - 1 ].distanceTo( curve[ i ] );
		}
	}
	
	lineLength = lineDistances[ numPoints - 1 ];
	
	var material = new THREE.LineDashedMaterial( {
		color: 0xf37d2c,
		dashSize: 1, // to be updated in the render loop
		gapSize: 1e10 // a big number, so only one dash is rendered
	});
	
	var line = new THREE.Line(geometry, material);
	
	// Stores the curve and line vertices in an array to be used later on for plotting
	circleNodeStart.addCurveLinePair(curve, line);
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
 *
 * @param circle
 * @param circleNodeStart
 * @param angle
 * @param eAngle
 * @param color
 */
function connectLinesFromCenter(circle, circleNodeStart, angle, eAngle, color, expansion) {
	let circleStart = circleNodeStart.circle;
	
	const radius = circleNodeStart.radius - expansion;
	
	let x, y, z; // Starting Coordinates
	let eX, eY, eZ; // Ending Coordinates
	
	/**
	 * 	Gets the position of the circle
	 * 	X Coordinates = radius * cos(angle)
	 * 	Y Coordinates = radius * sin(angle)
	 */
	// Start Point
	x = circleStart.position.x + (radius * Math.cos(toRadians(angle)));
	y = circleStart.position.y + (radius * Math.sin(toRadians(angle)));
	z = circleStart.position.z;
	
	// End Point
	eX = circle.position.x;
	eY = circle.position.y;
	eZ = circle.position.z;
	
	// console.log('x : ' + x);
	// console.log('y : ' + y);
	// console.log('z : ' + z);
	//
	// console.log('eX : ' + eX);
	// console.log('eY : ' + eY);
	// console.log('eZ : ' + eZ);
	
	
	var curve = new THREE.QuadraticBezierCurve3(
		new THREE.Vector3(x, y, z),
		new THREE.Vector3(circleStart.position.x, circleStart.position.y, z+500),
		new THREE.Vector3(eX, eY, eZ)
	).getPoints(500);
	
	
	var numPoints = curve.length;
	
	var geometry = new THREE.BufferGeometry();
	var positions = new Float32Array( numPoints * 3 ); // 3 vertices per point
	var lineDistances = new Float32Array( numPoints * 1 ); // 1 value per point
	
	geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
	geometry.addAttribute('lineDistance', new THREE.BufferAttribute(lineDistances, 1));
	
	for ( var i = 0, index = 0;  i < numPoints; i ++, index += 3 ) {
		positions[ index ] = curve[ i ].x;
		positions[ index + 1 ] = curve[ i ].y;
		positions[ index + 2 ] = curve[ i ].z;
		
		if ( i > 0 ) {
			lineDistances[ i ] = lineDistances[ i - 1 ] + curve[ i - 1 ].distanceTo( curve[ i ] );
		}
	}
	
	lineLength = lineDistances[ numPoints - 1 ];
	
	var orange = 0xf37d2c;
	var orange2 = 0xe5964e;
	
	var material = new THREE.LineDashedMaterial( {
		color: color,
		dashSize: 1, // to be updated in the render loop
		gapSize: 1e10 // a big number, so only one dash is rendered
	});
	
	material.transparent = true;
	material.opacity = 0.5;
	
	var line = new THREE.Line(geometry, material);
	
	// Stores the curve and line vertices in an array to be used later on for plotting
	circleNodeStart.addCurveLinePair(curve, line);
	sceneGL.add(line);
	
	/**
	 * Stores the values in Circle Node
	 */
	circleNodeStart.angle = angle;
	circleNodeStart.eAngle = eAngle;
}

/**
 * Animate line drawings
 * @param line
 * @param circle
 */
function drawLine(line, circle) {
	var fraction = 0;
	
	var interval = setInterval(function() {
		if(fraction < 0.99) {
			fraction += 0.01;
			line.material.dashSize = fraction * lineLength;
		}
		else {
			// When the animation has ended, Add the circles
			addCircleToScene(circle);
			clearInterval(interval);
		}
	}, 20);
	intervalsArray.push(interval);
}

/**
 * SERIES OF FUNCTIONS IN SEQUENCE
 * 1. Show process circle
 */

var processNode, librariesNode, folderNode;

/**
 * Visualise the process
 * @param {Process} process
 */
function drawProcess(process) {
	processNode = new ProcessNode(process.procName, process);
	processNode.name = process.procName;
	
	var radius = 100;
	var segments = 6;
	var material = new THREE.LineBasicMaterial({color: 0xf37d2c});
	var geometry = new THREE.CircleGeometry(radius, segments);
	
	processNode.radius = radius;
	
	// Remove center vertex
	geometry.vertices.shift();
	
	var hex = new THREE.Line(geometry, material);
	hex.position.x = 0;
	hex.position.y = 100;
	hex.position.z = -500;
	
	processNode.circle = hex;
	
	sceneGL.add(hex);
	insertLabel(processNode);
	
	keystrokeListener(drawLibraries, 49);
}

/** REWRITE DIFF FUNCTIONS */
function connectProcessLines(hex) {
	// var x = hex.position.x;
	// var y = hex.position.y;
	// var z = hex.position.z;
	//
	// var geometry = new THREE.Geometry();
	//
	// // Starting point
	// geometry.vertices.push(new THREE.Vector3(x, y, z));
	// // End point
	// geometry.vertices.push(new THREE.Vector3(x, y, z));
	//
	// var material = new THREE.LineBasicMaterial( {
	// 	color: 0xf37d2c
	// });
	//
	// var line = new THREE.Line(geometry, material);
	// sceneGL.add(line);
	//
	// processNode.addCurveLinePair(new THREE.Vector3(0, 15, -6), line);
	//
	// new TWEEN.Tween(line.geometry.vertices[1])
	// 	.to( { z: -12 }, Math.random() * 2000 )
	// 	.onUpdate(function() {
	// 		"use strict";
	// 		line.geometry.verticesNeedUpdate = true;
	// 	})
	// 	.easing( TWEEN.Easing.Exponential.InOut )
	// 	.start()
	// 	.onComplete(function() { drawLibraries() });
}

function drawLibraries() {
	/** Load libraries from db */
	getLibrariesByRank(processNode.process, function(process) {
		/** End function if library files are not loaded */
		if(process.libraries.length < 1) {
			// Proceed on to the next step
			keystrokeListener(drawTraversals, 50);
			return;
		}
		
		var i = 0;
		var angle = 0;
		var eAngle = 0;
		var elevation = 40;
		var libraries = process.libraries;
		var ANGLE_INCREMENT = 20;
		var condition = 360/ANGLE_INCREMENT;
		
		// Draw Library node
		librariesNode = drawCircleGeometry(500, 0x5fae9d, 1, 0, 100, -200, 'Libraries', 80, false);
		
		// Waits for the previous animation
		setTimeout(function() {
			addCircleToScene(librariesNode.circle);
			// Adds label
			insertLabel(librariesNode);
		}, 2500);
		
		console.log('DRAWING LIBRARIES');
		
		var interval = setInterval(function() {
			/** When libraries has been added, clear interval and illustrate the traversals*/
			if(libraries.length === i) {
				clearInterval(interval);
				/** When the interval has been completed, start the next phase*/
				keystrokeListener(drawTraversals, 50);
			}
			
			try {
				if(i !== 0 && i % condition === 0) elevation += 30;
				
				// Draw lines
				var childCircle = drawChildCircles(librariesNode, angle, libraries[i], elevation, 0xd9bd96, 1);
				// Create the line points
				connectLinesFromCenter(childCircle, processNode, angle, eAngle, 0xe5964e, 50);
				// Animate lines
				drawLine(processNode.lineTable[i], childCircle);
			}
			catch(err) {
				console.log(err);
			}
			
			angle += ANGLE_INCREMENT;
			eAngle += ANGLE_INCREMENT;
			i++;
		}, 50);
		// add interval to array
		intervalsArray.push(interval);
	});
}

function drawTraversals() {
	// Changes process node to red
	processNode.circle.material.color.setHex(0xc33923);
	
	getTraversalsByRank(processNode.process, function(process) {
		// End function
		if(process.traversals.length < 1) return;
		
		var i = 0;
		var angle = 0;
		var eAngle = 0;
		var elevation = 40;
		var traversals = process.traversals;
		var ANGLE_INCREMENT = 10;
		var condition = 360/ANGLE_INCREMENT;
		
		folderNode = drawCircleGeometry(700, 0x5fae9d, 1, 0, 100, 100, 'Directories', 80, false);
		addCircleToScene(folderNode.circle);
		
		insertLabel(folderNode);
		
		console.log('DRAWING TRAVERSALS');
		
		var interval = setInterval(function() {
			/** When libraries has been added, clear interval and illustrate the traversals */
			if(traversals.length == i) {
				clearInterval(interval);
				setTimeout(function() {
					/** When the interval has been completed, start the next phase*/
					keystrokeListener(drawFiles, 51);
				}, 2500);
			}
			
			try {
				// Increase the elevation for object
				if(i != 0 && i % condition === 0) elevation += 30;
				
				// Draw lines
				var childCircle = drawChildCircles(folderNode, angle, traversals[i], elevation, 0x68bab9, 1);
				// Create the line points
				connectLinesFromCenter(childCircle, librariesNode, angle, eAngle, 0xf37d2c, 450);
				// Animate lines
				drawLine(librariesNode.lineTable[i], childCircle);
			}
			catch(err) {}
			
			angle += ANGLE_INCREMENT;
			eAngle += ANGLE_INCREMENT;
			i++;
		}, 50);
		intervalsArray.push(interval);
	});
}

function drawFiles() {
	// Get the instance of process
	var files = processNode.process.files;
	
	if(files.length < 1) return;
	
	var childCircles = folderNode.childCircles;
	
	// Checks if the file belongs in the directory
	for(var i = 0; i < files.length; i++) {
		// Remove the backslashes from the file path
		var path = files[i].filePath.split('\\');
		// Remove the file form the url and reconstruct the url with backslashes
		var newPath = path.slice(0, path.length-1).join('\\') + '\\';
		
		// Match the files to the directories.
		for(var j = 0; j < childCircles.length; j++) {
			var parentPath = childCircles[j].userData.path;
			
			if(parentPath == newPath) {
				var cssObject = drawCSS3DNode(files[i], childCircles[j]);
				files[i].cssObject = cssObject;
				childCircles[j].userData.addFiles(files[i]);
				folderNode.map[childCircles[j].userData.path] = childCircles[j];
			}
		}
	}
	
	// Reduce opacity of all files
	reduceOpacity(folderNode);
	
	var tmpArray = [];
	
	// Adds items into array to be sorted
	for(var key in folderNode.map) {
		var childCircle = folderNode.map[key];
		tmpArray.push(childCircle);
	}
	
	// Sorts number of affected files in descending order
	tmpArray.sort(sortByFiles);
	
	// Shows all the infected folders
	
	for(var i = 0; i < tmpArray.length; i++) {
		var childCircle = tmpArray[i];
		
		// Change color to red
		childCircle.material.color.setHex(0xd04b62);
		
		new TWEEN.Tween(childCircle.material)
			.to({opacity: 1}, 2000)
			.easing(TWEEN.Easing.Exponential.InOut)
			.start();
		
		constructAffectedFolder(childCircle);
	}
}

/**
 * Sort the number of files affected
 *
 */
function sortByFiles(childCircleOne, childCircleTwo) {
	return childCircleTwo.userData.file.length - childCircleOne.userData.file.length;
}

var tempAffectedFilesObj = []; // Temporarily stores selected files;
/**
 * Called by onClick events
 * @param key
 */
function showAffectedFiles(key) {
	// Test remove later
	var childCircle = folderNode.map[key];
	var files = childCircle.userData.file;
	
	var x = folderNode.circle.position.x + ((folderNode.radius + 140) * Math.cos(toRadians(childCircle.angle)));
	var y = folderNode.circle.position.y + ((folderNode.radius + 140) * Math.sin(toRadians(childCircle.angle)));
	
	new TWEEN.Tween(childCircle.position)
		.to( { x: x, y: y }, 3500)
		.onUpdate(function() {
			childCircle.scale.set(2,2,2);
		})
		.easing(TWEEN.Easing.Exponential.InOut)
		.start();
	
	var x = childCircle.position.x;
	var y = childCircle.position.y;
	var z = childCircle.position.z;
	
	var incremental = 500;
	
	for(var i = 0; i < files.length; i++) {
		var file = files[i].cssObject;
		
		file.position.x = x;
		file.position.y = y;
		file.position.z = z;
		
		// Store reference of the selected object
		tempAffectedFilesObj.push(file);
		
		sceneCss.add(file);
		
		// new TWEEN.Tween(file.rotation)
		// 	.to({x: Math.PI / 2}, Math.random() * 2000)
		// 	.easing(TWEEN.Easing.Exponential.InOut)
		// 	.start();
		
		new TWEEN.Tween(file.position)
			.to({x: 650 + incremental, y: 300}, Math.random() * 2000 + 2000)
			.easing(TWEEN.Easing.Exponential.InOut)
			.start();
		
		incremental += 250;
	}
	
	return childCircle;
}

function removePreviousCSSObjects(previousCircle) {
	// revert the previous node back to its original position'
	if(previousCircle !== null) {
		var x = folderNode.circle.position.x + ((folderNode.radius) * Math.cos(toRadians(previousCircle.angle)));
		var y = folderNode.circle.position.y + ((folderNode.radius) * Math.sin(toRadians(previousCircle.angle)));
		
		new TWEEN.Tween(previousCircle.position)
			.to({x: x, y: y}, 3000)
			.easing(TWEEN.Easing.Exponential.InOut)
			.start()
			.onComplete(function() {
				previousCircle.scale.set(1,1,1);
			});
		
		// Iterates through the temp array to remove the raycasterObjects
		var tmp = [];
		for(var i = 0; i < tempAffectedFilesObj.length; i++) {
			tmp.push(tempAffectedFilesObj[i]);
			
			new TWEEN.Tween(tempAffectedFilesObj[i].position)
				.to({x: x, y: y}, 2000)
				.easing(TWEEN.Easing.Exponential.InOut)
				.start()
				.onComplete(function() {
					for(var i = 0 ; i < tmp.length; i++) {
						sceneCss.remove(sceneCss.getObjectById(tmp[i].id));
					}
					tmp = [];
				})
		}
		// clear the temp array
		tempAffectedFilesObj = [];
	}
}

function reduceOpacity(folderNode) {
	for(var i = 0; i < folderNode.childCircles.length; i++) {
		new TWEEN.Tween(folderNode.childCircles[i].material)
			.to({opacity: 0.2}, 1000)
			.easing(TWEEN.Easing.Exponential.In)
			.start();
		
		// Reduce Line opacity from origin point.
		// new TWEEN.Tween(librariesNode.lineTable[i].material)
		// 	.to({opacity: 0.3}, 1000)
		// 	.easing(TWEEN.Easing.Exponential.In)
		// 	.start();
	}
}

/**
 * @param file
 * @param {THREE.Line} dir
 * @returns {THREE.CSS3DObject}
 */
function drawCSS3DNode(file, dir) {
	var path = file.filePath.split('\\');
	var fileName = path[path.length-1];
	var fileExt = fileName.split('.');
	var fileId = file.fileId;
	
	fileExt = fileExt[fileExt.length-1];
	
	var fileNode = document.createElement('div');
	fileNode.className = 'file danger';
	fileNode.setAttribute('data-id', fileId);
	
	var ext = document.createElement('div');
	ext.className = 'ext';
	fileNode.appendChild(ext);

	var name = document.createElement('div');
	name.className = 'name';
	name.innerHTML = fileName;
	fileNode.appendChild(name);
	
	object = new THREE.CSS3DObject(fileNode);
	object.position.x = dir.position.x;
	object.position.y = dir.position.y;
	object.position.z = dir.position.z;
	
	return object;
}



function drawCSS3DLabel(circleNode ,x, y, z) {
	var name = circleNode.name;
	
	var label = document.createElement('div');
	label.className = 'indicate';
	label.innerHTML = name;
	
	var object = new THREE.CSS3DObject(label);
	object.position.x = x - 100;
	object.position.y = y;
	object.position.z = z;
	
	object.rotation.x = Math.PI/2;
	
	return object;
}

/**
 * Label
 * @param {CircleNode} circleNode
 */
function insertLabel(circleNode) {
	var circle = circleNode.circle;
	
	var x = circle.position.x + (circleNode.radius * Math.cos(toRadians(180)));
	var y = circle.position.y + (circleNode.radius* Math.sin(toRadians(180)));
	var z = circle.position.z;
	
	var eX = circle.position.x + ((circleNode.radius + 500) * Math.cos(toRadians(180)));
	var eY = circle.position.y + ((circleNode.radius + 500) * Math.sin(toRadians(180)));
	var eZ = circle.position.z;
	
	// console.log('x : ' + x);
	// console.log('y : ' + y);
	// console.log('z : ' + z);
	//
	// console.log('eX : ' + eX);
	// console.log('eY : ' + eY);
	// console.log('eZ : ' + eZ);
	
	var geometry = new THREE.Geometry();
	geometry.vertices.push(new THREE.Vector3(x,y,z));
	geometry.vertices.push(new THREE.Vector3(x, y, z));
	
	var material = new THREE.LineBasicMaterial({
		color: 0xffffff
	});
	
	material.transparent = true;
	material.opacity = 0.4;
	
	var line = new THREE.Line(geometry, material);
	
	//CSS 3D
	sceneGL.add(line);
	
	new TWEEN.Tween(geometry.vertices[1])
		.to({x: eX, y: eY, z: eZ}, 2000)
		.onUpdate(function() {
			geometry.verticesNeedUpdate = true;
		})
		.easing(TWEEN.Easing.Exponential.InOut)
		.start()
		.onComplete(function() {
			sceneCss.add(drawCSS3DLabel(circleNode, eX, eY, eZ));
		});
}

/**
 * Removes all items from sceneCss, sceneGL
 */
function resetScene() {
	processNode = null;
	librariesNode = null;
	folderNode = null;
	
	// Clear interval
	for(var i = 0; i < intervalsArray.length; i++) {
		clearInterval(intervalsArray[i]);
	}
	// Empty interval array
	intervalsArray = [];
	
	while(sceneGL.children.length > 0){
		sceneGL.remove(sceneGL.children[0]);
	}
	while(sceneCss.children.length > 0){
		sceneCss.remove(sceneCss.children[0]);
	}
}

/**
 * KeyStroke events
 */

function keystrokeListener(callback, keystroke) {
	$('body').on('keyup', function(e) {
		if(keystroke === e.which) callback();
	})
}

/**
 * Removes all child nodes
 */
function resetTable() {
	$('#affected-folders table tbody').empty();
	$('#selected-files table tbody').empty();
	
}

/**
 * Converts degrees to radians
 * @param angle {Number}
 */
function toRadians(angle) {
	return angle * Math.PI/180;
}

