#!/bin/env node

'use strict';

import os from 'os';
import path from 'path';
import fs from 'fs';
import clor from 'clor';
import yargs from 'yargs';

import pkg from '../package';
import config from '../lib/config';

let argv = yargs
  .usage('Usage: $0')
  .default('dataDir', () => {
    return null;
  })
  .argv;

let homieStyled = clor.magenta(`\
  _ _              _
 | | | ___ ._ _ _ <_> ___
 |   |/ . \\| ' ' || |/ ._>
 |_|_|\\___/|_|_|_||_|\\___.
`).string;

console.log(homieStyled);
console.log(`${clor.inverse.magenta(`Version ${pkg.version}`)}\n`);

let fail = (message) => {
  console.log(`${clor.red('error:')} ${message}`);
  process.exit(1);
};

let dataDir = argv.dataDir;

if (dataDir === null) {
  dataDir = path.join(os.homedir(), '/.homie');
}

try {
  fs.accessSync(dataDir, fs.R_OK | fs.W_OK);
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
mkjsonIfNotExisting(path.join(dataDir, '/infrastructure.json'), { devices: [] });
mkjsonIfNotExisting(path.join(dataDir, '/config.json'), { });
mkdirIfNotExisting(path.join(dataDir, '/ota'));
mkjsonIfNotExisting(path.join(dataDir, '/ota/manifest.json'), { firmwares: [] });
mkdirIfNotExisting(path.join(dataDir, '/ota/bin'));

config.dataDir = dataDir;
require('../index');
