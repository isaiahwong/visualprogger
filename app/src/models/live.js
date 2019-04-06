"use strict";

let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let liveSchema = new Schema({
    _id: {type: String},
    scanId: {type: Number},
    counter: {type: Number},
    processes: {
        score: Number,
        procName: String,
        procPath: String,
        rank: Number,
        libraries: [
            {libName: String},
            {libPath: String},
            {timestamp: Number},
            {procName: String},
            {procId: Number}
        ],
        traversals: [
            {procName: Number},
            {procId: Number},
            {dirName: String},
            {parentName: String},
            {timestamp: Number}
        ],
        files: [
            {fileId: String},
            {fileHandle: String},
            {filePath: String},
            {timestamp: Number}
        ]
    }
});

module.exports = mongoose.model("Live", liveSchema, "live");