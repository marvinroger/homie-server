'use strict';

import clor from 'clor';

class Log {
  log (message, meta, type) {
    let output = new Date().toISOString();
    output += ' ' + this._getColoredType(type);
    output += ' ';
    output += (undefined !== message ? message : '');
    if (meta && Object.keys(meta).length) {
      output += '\n';
      let stringify = JSON.stringify(meta, null, 2);
      let splitted = stringify.split('\n');
      splitted.forEach(function (line, index) {
        output += '  ' + line;
        if (index < splitted.length - 1) {
          output += '\n';
        }
      });
    }
    console.log(output);
  }

  fatal (message, meta) {
    return this.log(message, meta, 'fatal');
  }

  error (message, meta) {
    return this.log(message, meta, 'error');
  }

  warn (message, meta) {
    return this.log(message, meta, 'warn');
  }

  info (message, meta) {
    return this.log(message, meta, 'info');
  }

  debug (message, meta) {
    return this.log(message, meta, 'debug');
  }

  _getColoredType (type) {
    switch (type) {
      case 'fatal':
        return clor.inverse.bold.red('fatal:').toString();
      case 'error':
        return clor.red('error:').toString();
      case 'warn':
        return clor.yellow(' warn:').toString();
      case 'info':
        return clor.cyan(' info:').toString();
      case 'debug':
        return clor.underline.white('debug:').toString();
      default:
        return '  log:';
    }
  }
}

export default new Log();
