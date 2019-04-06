let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let linesSchema = new Schema({
    _id: {type: String},
    scanTimestamp: {type: Number},
    procPath: {type: String},
    procName: {type: String},
    score: {type: Number},
    rank: {type: Number},
    lines: [
        {timestamp: Number},
        {fileHandle: String},
        {fileId: String},
        {type: Number},
        {filePath: String}
    ]
});

module.exports = mongoose.model("Lines", linesSchema, "lines");