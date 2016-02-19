#!/usr/bin/env node

'use strict';

import ip from 'internal-ip';
import clor from 'clor';
import yargs from 'yargs';

import bootstrap from '../index';
import pkg from '../package';

let argv = yargs
  .usage('Usage: $0 [options]')
  .option('uiPort', {
    describe: 'Port you want the UI to listen to. Defaults to 80.'
  })
  .option('dataDir', {
    describe: "Top directory you want Homie's data to be stored in. Defaults to <homeDir>/.homie"
  })
  .help()
  .locale('en')
  .argv;

let homieStyled = clor.magenta(`\
  _ _              _
 | | | ___ ._ _ _ <_> ___
 |   |/ . \\| ' ' || |/ ._>
 |_|_|\\___/|_|_|_||_|\\___.
`).toString();

console.log(homieStyled);
console.log(clor.magenta('Version ').bold.magenta(pkg.version).line());

console.log(clor.magenta('See ').underline.magenta('https://git.io/homie-server#configuration').line());

console.log(clor.magenta('Homie server IP is ').bold.underline.magenta(ip.v4())());
console.log(clor.magenta("Make sure this IP won't change over time").line());

bootstrap({
  uiPort: argv.uiPort,
  dataDir: argv.dataDir
});
