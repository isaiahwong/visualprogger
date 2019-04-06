import Process from '../models/process';
import Live from '../models/live';

let io = null;
let clients = [];

export default function setupSocket(server) {
  io = require('socket.io')(server);
  _setupConnection();
}

function _setupConnection() {
  io.on('connection', function(socket) {
    console.log('New client connected, SOCKETID: ' + socket.id);

    socket.on('disconnect', function () {
        clients[socket.id] = false;
        console.log('Client has disconnected, SOCKETID: ' + socket.id);
    });

    socket.on('stop', function () {
        clients[socket.id] = false;
        console.log('Client stopped receiving, SOCKETID: ' + socket.id);
    });

    socket.on('scans', function () {
        Live.find({}, function (err, result) {
            if (err) {
                socket.emit('scans', JSON.stringify({error: err.message}));
                return;
            }

            if (result === null) {
                socket.emit('scans', JSON.stringify({error: "Error or Nothing Found"}));
                return;
            }

            let list = [];

            result.forEach(function (item) {
                if (!(list.indexOf(item.scanId) > -1)) {
                    list.push(item.scanId);
                }
            });

            list.sort(function(a, b){return b-a});

            socket.emit('scans', JSON.stringify(list));

        });
    });

    // message: scan ID
    socket.on('stream', function (message) {
        clients[socket.id] = true;
        let counter = null;
        let scanTimestamp = 0;

        // Ensure scan ID is provided in message
        if (message === undefined) {
            socket.emit('stream', JSON.stringify({error: "Please provide the scan timestamp"}));
            return;
        } else if (typeof message === 'string' || message instanceof String) {
            scanTimestamp = parseInt(message);
        } else {
            scanTimestamp = message;
        }

        Live.find().sort('+counter').exec((err, result) => {
            console.log(result.length)
            if (err) {
                socket.emit('stream', JSON.stringify({error: err.message}));
                return;
            }

            if (result === null) {
                socket.emit('stream', JSON.stringify({error: "Error or Nothing Found"}));
                return;
            }

            socket.emit('stream', JSON.stringify(result));
        });
    });
});
}

