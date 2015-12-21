'use strict';

import winston from 'winston';

winston.cli();

let log = new winston.Logger({
  level: 'debug',
  levels: {
    fatal: 0,
    error: 1,
    warn: 2,
    info: 3,
    debug: 4
  },
  colors: {
    debug: 'underline white',
    info: 'cyan',
    warning: 'yellow',
    error: 'red',
    fatal: 'inverse bold red'
  },
  transports: [
    new (winston.transports.Console)({
      colorize: true,
      formatter: function (options) {
        let output = new Date().toISOString();
        output += (options.level === 'info' || options.level === 'warn') ? ' ' : '';
        output += ' ' + winston.config.colorize(options.level, options.level);
        output += ': ';
        output += (undefined !== options.message ? options.message : '');
        if (options.meta && Object.keys(options.meta).length) {
          output += '\n';
          let stringify = JSON.stringify(options.meta, null, 2);
          let splitted = stringify.split('\n');
          splitted.forEach(function (line, index) {
            output += '  ' + line;
            if (index < splitted.length - 1) {
              output += '\n';
            }
          });
        }
        return output;
      }
    })
  ]
});

if (process.env.NODE_ENV === 'test') {
  log.remove(winston.transports.Console);
}

export default log;
