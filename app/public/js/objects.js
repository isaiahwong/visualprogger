/**
 * Created by Isaiah on 17/03/2017.
 */

/** PROCESS */
function Process() {
	this.id;
	this.scanTimestamp;
	this.procPath;
	this.procName;
	this.score;
	this.rank;
	this.files = [];
	this.lines = [];
	this.libraries = [];
	this.traversals = [];
	this.encrypts = [];
}

Process.prototype.constructParam = function(id, name, score, rank, path) {
	this.id = id;
	this.name = name;
	this.score = score;
	this.rank = rank;
	this.procPath = path;
};

Process.prototype.construct = function(process) {
	this.id = process._id;
	this.scanTimestamp = process.scanTimestamp;
	this.procName = process.procName;
	this.score = process.score;
	this.procPath = process.procPath;
	this.rank = process.rank;
};

Process.prototype.insertFiles = function(file) {
	this.files.push(file);
};

Process.prototype.copyFilesArray = function(files) {
	for(var i = 0; i < files.length; i++) {
		this.files.push(files[i]);
	}
};

Process.prototype.insertLines = function(line) {
	this.lines.push(line);
};

Process.prototype.copyLinesArray = function(lines) {
	for(var i = 0; i < lines.length; i++) {
		this.lines.push(lines[i]);
	}
};

Process.prototype.copyLibrariesArray = function(lib) {
	for(var i = 0; i < lib.length; i++) {
		var timestamp = lib[i].timestamp;
		var libName = lib[i].libName;
		var libPath = lib[i].libPath;
		
		var library = new Library(timestamp, libName, libPath);
		this.libraries.push(library);
	}
};

Process.prototype.copyTraversalsArray = function(traversal) {
	for(var i = 0; i < traversal.length; i++) {
		if(traversal[i] !== 'undefined') {
			var timestamp = traversal[i].timestamp;
			var dirName = traversal[i].dirName;
			var parentName = traversal[i].parentName;
			
			var traversalObject = new Traversal(timestamp, dirName, parentName);
			this.traversals.push(traversalObject);
		}
	}
};

Process.prototype.copyEncryptsArray = function(encrypts) {
	for(var i = 0; i < encrypts.length; i++) {
		var file = new File();
		
		var fileHandle = encrypts[i].fileHandle;
		var fileId = encrypts[i].fileId;
		var filePath = encrypts[i].filePath;
		var timestamp = encrypts[i].timestamp;
		
		file.construct(timestamp, fileHandle, fileId, filePath);
		this.encrypts.push(file);
	}
};

/** LIBRARIES */
function Library(timestamp, libName, libPath) {
	this.timestamp = timestamp;
	this.libName = libName;
	this.libPath = libPath;
}

/** TRAVERSALS */
function Traversal(timestamp, dirName, parentName) {
	this.timestamp = timestamp;
	this.dirName = dirName;
	this.parentName = parentName;
	this.files = [];
}

Traversal.prototype.addFile = function(file) {
	this.files.push(file);
};

/** */

/** FILE */
function File() {
	this.timestamp;
	this.fileHandle;
	this.fileId;
	this.filePath;
}

File.prototype.construct = function(timestamp, fileHandle, fileId, filePath) {
	this.timestamp = timestamp;
	this.fileHandle = fileHandle;
	this.fileId = fileId;
	this.filePath = filePath;
};

/** LINE */
function Line() {
	this.timestamp;
	this.fileHandle;
	this.fileId;
	this.type;
	this.filePath;
}

/** VISUAL MODELS */
function DirectoryNode() {
	this.name;
	this.child = [];
	this.path;
	this.events;
}

DirectoryNode.prototype.addCSS3DObject = function(object) {
	this.css3DObject = object;
};

DirectoryNode.prototype.addCanvasObject = function(object) {
	this.canvasObject = object;
};

function FileNode() {
	this.name;
	this.extension;
	this.events = [];
	this.action;
}

FileNode.prototype.addCSS3DObject = function(object) {
	this.css3DObject = object;
};

FileNode.prototype.addCanvasObject = function(object) {
	this.canvasObject = object;
};

function SquareNode() {
	this.name;
	this.square;
	this.width;
	this.angle; // Stores the last inserted angle
	this.eAngle; // Stores the last inserted end point angle
	this.map = {};
	this.curve = [];
	this.lineTable = [];
	this.traversalLineTable = [];
	this.process;
	this.label;
	this.object;
}

SquareNode.prototype.addCurveLinePair = function(curve, line) {
	this.curve.push(curve);
	this.lineTable.push(line);
};

SquareNode.prototype.addTraversalLine = function(line) {
	this.traversalLineTable.push(line);
};

function CircleNode() {
	this.name;
	this.circle;
	this.radius;
	this.angle; // Stores the last inserted angle
	this.eAngle; // Stores the last inserted end point angle
	this.map = {};
	this.curve = [];
	this.lineTable = [];
	this.traversalLineTable = [];
	this.childCircles = [];
	this.barScore = [];
	this.process;
	this.label;
	this.object;
	this.thickCircles = [];
}

CircleNode.prototype.addCurveLinePair = function(curve, line) {
	this.curve.push(curve);
	this.lineTable.push(line);
};

CircleNode.prototype.addChildCircle = function(circle) {
	this.childCircles.push(circle);
};

CircleNode.prototype.addBarScore = function(bar) {
	this.barScore.push(bar);
};

CircleNode.prototype.addTraversalLine = function(line) {
	this.traversalLineTable.push(line);
};

CircleNode.prototype.copyThickCircles = function(lines) {
	for(var i = 0; i < lines.length; i++) {
		this.thickCircles.push(lines[i]);
	}
};

CircleNode.prototype.addThickCircles = function(object) {
	this.thickCircles.push(object);
};

function LineSettings(color, speed) {
	this.color = color;
	this.speed = speed;
}

/**
 * ProcessNode. Inherits from CircleNode
 */
ProcessNode.prototype = new CircleNode();
ProcessNode.prototype.constructor = ProcessNode;

function ProcessNode(processName, process) {
	this.processName = processName;
	this.process = process;
	this.endPoint;
}

/** CHILD CIRCLE */
function ChildCircleData(name, path) {
	this.name = name;
	this.path = path;
	this.file = [];
}

ChildCircleData.prototype.addFiles = function(file) {
	// Note, file is passed by reference.
	this.file.push(file);
};

/**
 * BAR SCORE
 * @param {THREE.LineSegments} bar
 * @param {String} name
 * @param {Score} score
 * @constructor
 */
function BarScore(bar, name, score) {
	this.bar = bar;
	this.name = name;
	this.score = score;
	this.rank;
	this.angle;
}

BarScore.prototype.changeScore = function(score) {
	this.score = score;
};

/** SCORE */
function Score(id, name, score, rank, path) {
	this.id = id;
	this.name = name;
	this.score = score;
	this.rank = rank;
	this.path = path;
}

/**

/**
 * Progger System Call
 * DIRNODE can be referred to directory or file in windows
 */
const SysCall =  {
	USER_INFO: 0,                         // (ANNOTATE) CAN contain the username/domain name
	
	PROCESS_CREATE : 1,                    // (ANNOTATE) MUST contain the process name including full path relative to FS root
	// CAN contain the operating system specific processId
	PROCESS_EXIT : 2,                      //
	
	FILE_OPEN : 3,                         // MUST contain the file name including full path relative to FS root
	// MUST generate and contain a unique file handle value
	FILE_CLOSE : 4,                        // MUST contain the file handle value
	FILE_READ : 5,                         // MUST contain the file handle value
	// MUST contain the byte length and offset
	FILE_WRITE : 6,                        // MUST contain the file handle value
	// MUST contain the byte length and offset
	
	// TODO: socket args
	SOCKET_OPEN : 7,                       //
	SOCKET_CLOSE : 8,                      //
	SOCKET_READ : 9,                       //
	SOCKET_WRITE : 10,                     //
	
	DIRNODE_CREATE : 11,                   // MUST contain the directory/file name relative to the FS root
	DIRNODE_DELETE : 12,                   // MUST contain the directory/file name relative to the FS root
	DIRNODE_RENAME : 13,                   // MUST contain the old and new directory/file name relative to the FS root
	DIRNODE_LINK : 14,                     // MUST contain the old and new directory/file name relative to the FS root
	DIRNODE_CHANGE_OWNER : 15,             // MUST contain the new owner's user ID
	DIRNODE_CHANGE_PERMISSIONS : 16,       //
	
	HANDLE_DUPLICATE : 17,                 // MUST contain the type of handle being duplicated (1=FILE, 2=SOCKET)
										   // MUST contain the old handle value of the handle
	
	getKey: function(value) {
		var object = this;
		return Object.keys(object).find(key => object[key] === value);
	},
	/**
	 * Returns css class for color coding
	 * @param {Number} actionNum
	 */
	getLabelCssClass: function (actionNum) {
		var cssClass = "";
		
		switch(actionNum) {
			// FILE OPEN, SOCKET OPEN
			case 3: case 8:
			cssClass = "green-label";
			break;
			// PROCESS EXIT, FILE CLOSE, SOCKET CLOSE
			case 2: case 4: case 7:
			cssClass = "blue-label";
			break;
			// FILE READ, SOCKET READ
			case 5: case 9:
			cssClass = "yellow-label";
			break;
			// WRITE, DELETE, CREATE, RENAME, CHANGE OWNER, CHANGE PERM
			case 1: case 6: case 10: case 11: case 12: case 13: case 14: case 15: case 16:
			cssClass = "red-label";
			break;
			default:
				cssClass = "blue-label";
		}
		
		return cssClass;
	},
	
	/**
	 *
	 * @param str System call with underscores
	 * @returns {String} System call name
	 */
	
	formatName: function (str) {
		var seperatedStr = str.split('_');
		
		
		var type = seperatedStr[0];
		/**
		 * Join two strings if the array size is more 2
		 * Used for words wth 3 underscores for instance, foo_bar_foo
		 */
		var sysCallName = (seperatedStr.length > 2) ? seperatedStr[1] + ' ' +seperatedStr[2] : seperatedStr[1];
		var leadingLetter = '';
		
		switch(type) {
			case 'PROCESS':
				leadingLetter = 'P';
				break;
			case 'FILE':
				leadingLetter = 'F';
				break;
			case 'SOCKET':
				leadingLetter = 'S';
				break;
			case 'DIRNODE':
				leadingLetter = '';
				break;
			
		}
		sysCallName = (seperatedStr.length > 2) ? seperatedStr[1] + '_' + leadingLetter + sysCallName : leadingLetter + sysCallName;
		
		return sysCallName;
	}
	
};

String.prototype.capitalizeFirstLetter = function() {
	return this.charAt(0).toUpperCase() + this.slice(1);
};

// /**
//  * PHASE
//  * @constructor
//  */
// function Phases() {
// 	this.interval = [];
// }
//
// // Adds a interval into phase
// Phases.prototype.insertInterval = function(interval) {
// 	this.interval.push(interval);
// };
//
// /**
//  * INTERVAL
//  * @constructor
//  */
// function Interval() {
// 	this.events = [];
// }
//
// // Add a event into the array
// Interval.prototype.insertEvent = function(event) {
// 	this.events.push(event);
// };
//
// /**
//  * EVENT
//  * @constructor
//  */
// function Event() {
// 	this.type;
// 	this.timestamp;
// 	this.file;
// 	this.fileId;
// 	this.process;
// 	this.processId;
// }



