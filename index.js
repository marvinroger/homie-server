'use strict';

import os from 'os';
import path from 'path';
import fs from 'fs';
import YAML from 'yamljs';
import _ from 'underscore';

import dispatcher from './lib/dispatcher';
import dataValidator from './lib/validators/datadir';

import log from './lib/log';

import HomieServer from './lib/servers/homie';
import GuiServer from './lib/servers/gui';
import OtaServer from './lib/servers/ota';
import Infrastructure from './lib/infrastructure';

const DEFAULT_UI_PORT = 80;
const DEFAULT_DATADIR = path.join(os.homedir(), '/.homie');

let config = {};

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
  let infrastructure = new Infrastructure({ dataDir: config.dataDir });
  dispatcher.attach('infrastructure', infrastructure);

  const Servers = [{
    Class: HomieServer,
    params: { dataDir: config.dataDir }
  }, {
    Class: GuiServer,
    params: { port: config.uiPort }
  }, {
    Class: OtaServer,
    params: { dataDir: config.dataDir }
  }];

  Servers.forEach(function (Server) {
    let server = new Server.Class(Server.params);
    server.start();

    server.on('ready', function (data) {
      log.info(`${server.getName()} server listening on ${data.host}:${data.port}`);
      dispatcher.attach(server.getName(), server);
      serversReady();
    });

    server.on('error', function (err) {
      log.fatal(`${server.getName()} server cannot listen`, err);
      process.exit(1);
    });
  });

  let serversReady = _.after(Servers.length, () => {
    dispatcher.start();
  });
};

export default bootstrap;
