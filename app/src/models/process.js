"use strict";

let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let processSchema = new Schema({
    _id: {type: String},
    scanTimestamp: {type: Number},
    procPath: {type: String},
    procName: {type: String},
    score: {type: Number},
    rank: {type: Number},
    files: [
        {timestamp: Number},
        {fileHandle: String},
        {fileId: String},
        {filePath: String}
    ],
    libraries: [
        {libName: String},
        {libPath: String},
        {timestamp: Number}
    ],
    traversals: [
        {timestamp: Number},
        {dirName: String},
        {parentName: String}
    ]
});

module.exports = mongoose.model("Process", processSchema, "processes");