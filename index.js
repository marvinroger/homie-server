'use strict';

import _ from 'underscore';

import homieServer from './lib/servers/homie';
import guiServer from './lib/servers/gui';
import otaServer from './lib/servers/ota';
import infrastructure from './lib/infrastructure';

import log from './lib/log';

const servers = [homieServer, guiServer, otaServer];

servers.forEach(function (server) {
  server.start();

  server.on('ready', function (data) {
    log.info(`${server.getName()} server listening on ${data.host}:${data.port}`);
    serversReady();
  });

  server.on('error', function (err) {
    log.fatal(`${server.getName()} server cannot listen`, err);
    process.exit(1);
  });
});

let serversReady = _.after(servers.length, () => {
  infrastructure.on('update', function (patch) {
    guiServer.getWebsocket().emit('infrastructure_updated', patch);
  });

  // WebSocket connect handler

  guiServer.getWebsocket().on('connection', function (socket) {
    socket.emit('infrastructure', {
      devices: infrastructure.getRepresentation().devices,
      groups: infrastructure.getRepresentation().groups
    });

    socket.on('set_property', function (data) {
      infrastructure.sendProperty(data);
    });
  });
});
