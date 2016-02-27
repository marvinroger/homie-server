'use strict';

import os from 'os';
import path from 'path';
import fs from 'fs';
import YAML from 'yamljs';

import dispatcher from './lib/dispatcher';
import dataValidator from './lib/validators/datadir';

import log from './lib/log';

import GuiServer from './lib/servers/gui';
import OtaServer from './lib/servers/ota';

import MqttClient from './lib/clients/mqtt';
import Infrastructure from './lib/infrastructure';

const DEFAULT_UI_PORT = 80;
const DEFAULT_DATADIR = path.join(os.homedir(), '/.homie');

const config = {};

const bootstrap = (options) => {
  const uiPort = options.uiPort || DEFAULT_UI_PORT;
  const dataDir = options.dataDir || DEFAULT_DATADIR;
  if (typeof options.logLevel !== 'undefined') {
    log.setLogLevel(options.logLevel);
  }

  log.info(`Using data directory ${dataDir}`);

  const fail = (message) => {
    log.fatal(message);
    process.exit(1);
  };

  if (!Number.isInteger(uiPort) || uiPort < 1 || uiPort > 65535) {
    fail('UI port must be a valid port');
  }

  const mkdirIfNotExisting = (dir) => {
    try {
      fs.mkdirSync(dir);
    } catch (err) {
      return;
    }
  };

  const mkyamlIfNotExisting = (path, object) => {
    try {
      fs.accessSync(path, fs.R_OK | fs.W_OK);
    } catch (err) {
      fs.writeFileSync(path, YAML.stringify(object, null, 2), 'utf8');
    }
  };

  mkdirIfNotExisting(dataDir);
  mkyamlIfNotExisting(path.join(dataDir, '/infrastructure.yml'), { devices: [], groups: [] });
  mkyamlIfNotExisting(path.join(dataDir, '/config.yml'), { mqtt: { url: 'mqtt://127.0.0.1:1883' } });
  mkdirIfNotExisting(path.join(dataDir, '/ota'));
  mkyamlIfNotExisting(path.join(dataDir, '/ota/manifest.yml'), { firmwares: [] });
  mkdirIfNotExisting(path.join(dataDir, '/ota/firmwares'));
  mkdirIfNotExisting(path.join(dataDir, '/db'));

  var infrastructure = YAML.load(path.join(dataDir, '/infrastructure.yml'));
  if (!dataValidator.validateInfrastructure(infrastructure)) {
    fail('infrastructure.yml is invalid');
  }

  var configFile = YAML.load(path.join(dataDir, '/config.yml'));
  if (!dataValidator.validateConfig(configFile)) {
    fail('config.yml is invalid');
  }

  config.dataDir = dataDir;
  config.uiPort = uiPort;

  config.file = configFile;

  start();
};

const start = async () => {
  const servers = [{
    Class: GuiServer,
    params: { port: config.uiPort }
  }, {
    Class: OtaServer,
    params: { dataDir: config.dataDir }
  }];

  const infrastructure = new Infrastructure({ dataDir: config.dataDir });
  await infrastructure.start();
  dispatcher.attach('infrastructure', infrastructure);

  await (function startServers () {
    return new Promise((resolve, reject) => {
      let i = 0;
      servers.forEach(async function (server) {
        const serverInstance = new server.Class(server.params);
        try {
          const data = await serverInstance.start();
          dispatcher.attach(serverInstance.getName().toLowerCase(), serverInstance);
          log.info(`${serverInstance.getName()} server listening on ${data.host}:${data.port}`);
          if (++i === servers.length) { resolve(); }
        } catch (err) {
          log.fatal(`${serverInstance.getName()} server cannot listen`, err);
          process.exit(1);
        }
      });
    });
  })();

  const mqttClient = new MqttClient(config.file.mqtt);
  mqttClient.start();
  dispatcher.attach('mqtt', mqttClient);

  log.info('Homie is ready');
  dispatcher.start();
};

export default bootstrap;
