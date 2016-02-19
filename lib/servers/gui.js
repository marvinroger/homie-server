'use strict';

import path from 'path';
import {createServer} from 'http';
import express from 'express';
import socketIo from 'socket.io';

import Server from './server';

class GuiServer extends Server {
  constructor (options) {
    super('GUI');

    this.port = options.port;

    this.app = express();
    this.server = createServer(this.app);
    this.websocket = socketIo(this.server);

    this.app.use(express.static(__dirname + '/../../public'));

    this.app.get('/offline.html', function (req, res) {
      res.sendFile(path.resolve(__dirname + '/../../views/offline.html')); // path resolve else with relative path express might cry
    });

    this.app.all('*', function (req, res) {
      res.sendFile(path.resolve(__dirname + '/../../views/index.html'));
    });

    this.websocket.on('connection', (socket) => {
      this.emit('connection', socket);
    });
  }

  start () {
    this.server.listen(this.port, () => {
      let host = this.server.address().address;
      let port = this.server.address().port;
      this.emit('ready', { host: host, port: port });
    }).on('error', (err) => {
      this.emit('error', err);
    });
  }

  emitToWebsocket (type, message) {
    this.websocket.emit(type, message);
  }
}

export default GuiServer;
