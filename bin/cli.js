#!/usr/bin/env node

'use strict';

import os from 'os';
import ip from 'internal-ip';
import path from 'path';
import fs from 'fs';
import clor from 'clor';
import yargs from 'yargs';

import log from '../lib/log';
import dataValidator from '../lib/validators/datadir';
import pkg from '../package';
import config from '../lib/config';

let argv = yargs
  .usage('Usage: $0')
  .default('dataDir', () => {
    return null;
  }).default('uiPort', () => {
    return null;
  })
  .argv;

let dataDir = argv.dataDir;
if (dataDir === null) {
  dataDir = path.join(os.homedir(), '/.homie');
}

let uiPort = argv.uiPort;
if (!Number.isInteger(uiPort) || uiPort < 1 || uiPort > 65535) {
  uiPort = 80;
}

let homieStyled = clor.magenta(`\
  _ _              _
 | | | ___ ._ _ _ <_> ___
 |   |/ . \\| ' ' || |/ ._>
 |_|_|\\___/|_|_|_||_|\\___.
`).toString();

console.log(homieStyled);
console.log(clor.magenta(`Version ${clor.bold(`${pkg.version}`)}\n`).toString());

console.log(clor.magenta(`Your data directory is ${clor.bold.underline(`${dataDir}`)}`).toString());
console.log(clor.magenta(`See https://git.io/homie-server#configuration\n`).toString());

console.log(clor.magenta(`Homie server IP is ${clor.bold.underline(`${ip.v4()}`)}`).toString());
console.log(clor.magenta("Make sure this IP won't change over time\n").toString());

let fail = (message) => {
  log.fatal(message);
  process.exit(1);
};

try {
  fs.accessSync(path.join(dataDir, '..'), fs.R_OK | fs.W_OK);
} catch (err) {
  fail(`Cannot access dataDir ${dataDir}`);
}

let mkdirIfNotExisting = (dir) => {
  try {
    fs.mkdirSync(dir);
  } catch (err) {
    return;
  }
};

let mkjsonIfNotExisting = (path, object) => {
  try {
    fs.accessSync(path, fs.R_OK | fs.W_OK);
  } catch (err) {
    fs.writeFileSync(path, JSON.stringify(object, null, 2), 'utf8');
  }
};

mkdirIfNotExisting(dataDir);
mkjsonIfNotExisting(path.join(dataDir, '/infrastructure.json'), { devices: [], groups: [] });
mkjsonIfNotExisting(path.join(dataDir, '/config.json'), { });
mkdirIfNotExisting(path.join(dataDir, '/ota'));
mkjsonIfNotExisting(path.join(dataDir, '/ota/manifest.json'), { firmwares: [] });
mkdirIfNotExisting(path.join(dataDir, '/ota/bin'));
mkdirIfNotExisting(path.join(dataDir, '/db'));

var infrastructure = require(path.join(dataDir, '/infrastructure.json'));
if (!dataValidator.validateInfrastructure(infrastructure)) {
  fail('infrastructure.json is invalid');
}

config.dataDir = dataDir;
config.uiPort = uiPort;
require('../index');
