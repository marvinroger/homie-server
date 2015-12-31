'use strict';

import os from 'os';
import path from 'path';
import fs from 'fs';
import YAML from 'yamljs';
import _ from 'underscore';

import dataValidator from './lib/validators/datadir';
import config from './lib/config';

import log from './lib/log';

const DEFAULT_UI_PORT = 80;
const DEFAULT_DATADIR = path.join(os.homedir(), '/.homie');

let bootstrap = (options) => {
  let uiPort = options.uiPort || DEFAULT_UI_PORT;
  let dataDir = options.dataDir || DEFAULT_DATADIR;

  log.info(`Using data directory ${dataDir}`);

  let fail = (message) => {
    log.fatal(message);
    process.exit(1);
  };

  if (!Number.isInteger(uiPort) || uiPort < 1 || uiPort > 65535) {
    fail('UI port must be a valid port');
  }

  let mkdirIfNotExisting = (dir) => {
    try {
      fs.mkdirSync(dir);
    } catch (err) {
      return;
    }
  };

  let mkyamlIfNotExisting = (path, object) => {
    try {
      fs.accessSync(path, fs.R_OK | fs.W_OK);
    } catch (err) {
      fs.writeFileSync(path, YAML.stringify(object, null, 2), 'utf8');
    }
  };

  mkdirIfNotExisting(dataDir);
  mkyamlIfNotExisting(path.join(dataDir, '/infrastructure.yml'), { devices: [], groups: [] });
  mkyamlIfNotExisting(path.join(dataDir, '/config.yml'), { });
  mkdirIfNotExisting(path.join(dataDir, '/ota'));
  mkyamlIfNotExisting(path.join(dataDir, '/ota/manifest.yml'), { firmwares: [] });
  mkdirIfNotExisting(path.join(dataDir, '/ota/bin'));
  mkdirIfNotExisting(path.join(dataDir, '/db'));

  var infrastructure = YAML.load(path.join(dataDir, '/infrastructure.yml'));
  if (!dataValidator.validateInfrastructure(infrastructure)) {
    fail('infrastructure.yml is invalid');
  }

  config.dataDir = dataDir;
  config.uiPort = uiPort;

  start();
};

let start = () => {
  let homieServer = require('./lib/servers/homie').default;
  let guiServer = require('./lib/servers/gui').default;
  let otaServer = require('./lib/servers/ota').default;
  let infrastructure = require('./lib/infrastructure').default;
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
};

export default bootstrap;
