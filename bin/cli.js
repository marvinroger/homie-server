#!/usr/bin/env node

'use strict';

import ip from 'internal-ip';
import clor from 'clor';
import yargs from 'yargs';

import bootstrap from '../index';
import pkg from '../package';
import log from '../lib/log';

const argv = yargs
  .usage('Usage: $0 [options]')
  .option('uiPort', {
    describe: 'Port you want the UI to listen to. Defaults to 80'
  })
  .option('dataDir', {
    describe: "Top directory you want Homie's data to be stored in. Defaults to <homeDir>/.homie"
  })
  .option('logLevel', {
    describe: 'Minimum log level for console output'
  })
  .help()
  .locale('en')
  .argv;

// Font: Dr Pepper
const homieStyled = clor.magenta(`\
 _____           _        _____
|  |  |___ _____|_|___   |   __|___ ___ _ _ ___ ___
|     | . |     | | -_|  |__   | -_|  _| | | -_|  _|
|__|__|___|_|_|_|_|___|  |_____|___|_|  \\_/|___|_|
`);

log.print(homieStyled);
log.print(clor.magenta('Version ').bold.magenta(pkg.version).line());

log.print(clor.magenta('See ').underline.magenta('https://git.io/homie-server#configuration').line());

log.print(clor.magenta('Homie server IP is ').bold.underline.magenta(ip.v4())());
log.print(clor.magenta("Make sure this IP won't change over time").line());

bootstrap({
  uiPort: argv.uiPort,
  dataDir: argv.dataDir,
  logLevel: argv.logLevel
});
