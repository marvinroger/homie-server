'use strict';

import os from 'os';
import path from 'path';
import fs from 'fs';
import YAML from 'yamljs';

import dispatcher from './lib/dispatcher';
import dataValidator from './lib/validators/datadir';

import log from './lib/log';

import MqttServer from './lib/servers/mqtt';
import GuiServer from './lib/servers/gui';
import OtaServer from './lib/servers/ota';
import Infrastructure from './lib/infrastructure';

const DEFAULT_UI_PORT = 80;
const DEFAULT_DATADIR = path.join(os.homedir(), '/.homie');

let config = {};

let bootstrap = (options) => {
  let uiPort = options.uiPort || DEFAULT_UI_PORT;
  let dataDir = options.dataDir || DEFAULT_DATADIR;
  if (typeof options.logLevel !== 'undefined') {
    log.setLogLevel(options.logLevel);
  }

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
  mkdirIfNotExisting(path.join(dataDir, '/ota/firmwares'));
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
  const servers = [{
    Class: MqttServer,
    params: { dataDir: config.dataDir }
  }, {
    Class: GuiServer,
    params: { port: config.uiPort }
  }, {
    Class: OtaServer,
    params: { dataDir: config.dataDir }
  }];

  let serversReadyCount = 0;
  let serversReady = function () {
    if (++serversReadyCount === servers.length + 1) { // +1 for infrastructure
      log.info(`Servers started`);
      dispatcher.start();
    }
  };

  let infrastructure = new Infrastructure({ dataDir: config.dataDir });
  infrastructure.on('ready', () => {
    dispatcher.attach('infrastructure', infrastructure);
    serversReady();
  });
  infrastructure.start();

  servers.forEach(function (server) {
    let serverInstance = new server.Class(server.params);

    serverInstance.on('ready', function (data) {
      log.info(`${serverInstance.getName()} server listening on ${data.host}:${data.port}`);
      dispatcher.attach(serverInstance.getName().toLowerCase(), serverInstance);
      serversReady();
    });

    serverInstance.on('error', function (err) {
      log.fatal(`${serverInstance.getName()} server cannot listen`, err);
      process.exit(1);
    });

    serverInstance.start();
  });
};

export default bootstrap;
