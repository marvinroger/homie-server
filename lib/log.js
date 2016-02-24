'use strict';

import clor from 'clor';

const FATAL = 0;
const ERROR = 1;
const WARN = 2;
const INFO = 3;
const DEBUG = 4;

class Log {
  constructor () {
    this.logLevel = INFO;
  }

  setLogLevel (logLevel) {
    this.logLevel = logLevel;
  }

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
    if (this.logLevel >= FATAL) {
      return this.log(message, meta, FATAL);
    }
  }

  error (message, meta) {
    if (this.logLevel >= ERROR) {
      return this.log(message, meta, ERROR);
    }
  }

  warn (message, meta) {
    if (this.logLevel >= WARN) {
      return this.log(message, meta, WARN);
    }
  }

  info (message, meta) {
    if (this.logLevel >= INFO) {
      return this.log(message, meta, INFO);
    }
  }

  debug (message, meta) {
    if (this.logLevel >= DEBUG) {
      return this.log(message, meta, DEBUG);
    }
  }

  _getColoredType (type) {
    switch (type) {
      case FATAL:
        return clor.inverse.bold.red('fatal:').toString();
      case ERROR:
        return clor.red('error:').toString();
      case WARN:
        return clor.yellow(' warn:').toString();
      case INFO:
        return clor.cyan(' info:').toString();
      case DEBUG:
        return clor.underline.white('debug:').toString();
      default:
        return '  log:';
    }
  }
}

export default new Log();
