#!/bin/env node

'use strict';

let os = require('os');
let path = require('path');
let fs = require('fs');
let clor = require('clor');
let argv = require('yargs')
  .usage('Usage: $0')
  .default('dataDir', () => {
    return os.homedir();
  })
  .argv;

let pkg = require('../package');

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

try {
  fs.accessSync(dataDir, fs.R_OK | fs.W_OK);
} catch (err) {
  fail(`Cannot access dataDir ${dataDir}`);
}

let homieDir = path.join(`${dataDir}/.homie`);

let mkdirIfNotExisting = (dir) => {
  try {
    fs.mkdirSync(dir);
  } catch (err) {
  }
};

let mkjsonIfNotExisting = (path, object) => {
  let exist;
  try {
    fs.accessSync(path, fs.R_OK | fs.W_OK);
    exist = true;
  } catch (err) {
    exist = false;
  }

  if (!exist) {
    fs.writeFileSync(path, JSON.stringify(object, null, 2), 'utf8');
  }
};

mkdirIfNotExisting(homieDir);
mkjsonIfNotExisting(path.join(`${homieDir}/infrastructure.json`), { devices: [] });
mkjsonIfNotExisting(path.join(`${homieDir}/config.json`), { });
mkdirIfNotExisting(path.join(`${homieDir}/ota`));
mkjsonIfNotExisting(path.join(`${homieDir}/ota/manifest.json`), { firmwares: [] });
mkdirIfNotExisting(path.join(`${homieDir}/ota/bin`));

require('../lib/config').dataDir = homieDir;
require('../server');
