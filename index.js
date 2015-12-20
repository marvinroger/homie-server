'use strict';

import {createServer} from 'http';
import express from 'express';
import socketIo from 'socket.io';

import log from './lib/log';
import infrastructure from './lib/infrastructure';
import ota from './lib/ota';

let app = express();
let server = createServer(app);
let websocket = socketIo(server);

// Watch for infrastructure changes and send to Websocket

infrastructure.on('update', function (patch) {
  websocket.emit('infrastructure_updated', patch);
});

// WebSocket connect handler

websocket.on('connection', function (socket) {
  socket.emit('infrastructure', {
    devices: infrastructure.getRepresentation().devices,
    groups: infrastructure.getRepresentation().groups
  });

  socket.on('set_property', function (data) {
    infrastructure.sendProperty(data);
  });
});

// Static HTTP server

app.use(express.static(__dirname + '/public'));

app.use('/ota', ota.httpHandler);

app.get('*', function (req, res) {
  res.sendFile(__dirname + '/public/index.html');
});

server.listen(3000, function () {
  let host = server.address().address;
  let port = server.address().port;
  log.info(`HTTP server listening on ${host}:${port}`);
}).on('error', function (err) {
  log.fatal(err);
});
