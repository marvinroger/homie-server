'use strict';

import path from 'path';
import {Promise} from 'bluebird';
import Datastore from 'nedb';

Promise.promisifyAll(Datastore.prototype);

class Database {
  constructor (options) {
    this._db = new Datastore({ filename: path.join(options.dataDir, `/db/${options.dbName}.db`), autoload: true });
    this._db.persistence.setAutocompactionInterval(60 * 1000);
  }

  get db () {
    return this._db;
  }
}

export default Database;
