'use strict';

import path from 'path';
import {Promise} from 'bluebird';
import Datastore from 'nedb';

import config from './config';

Promise.promisifyAll(Datastore.prototype);

class Database {
  constructor (dbName) {
    this._db = new Datastore({ filename: path.join(config.dataDir, `/db/${dbName}.db`), autoload: true });
    this._db.persistence.setAutocompactionInterval(60 * 1000);
  }

  get db () {
    return this._db;
  }
}

export default Database;
