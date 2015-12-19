'use strict';

let promisifyAll = require('bluebird').Promise.promisifyAll;
let config = require('./config');

let Datastore = require('nedb');
promisifyAll(Datastore.prototype);

let db = new Datastore({ filename: config.dataDir + '/db/devices.db', autoload: true });
db.persistence.setAutocompactionInterval(60 * 1000);

module.exports = db;
