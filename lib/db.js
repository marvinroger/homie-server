'use strict';

import {Promise} from 'bluebird';
import Datastore from 'nedb';

import config from './config';

Promise.promisifyAll(Datastore.prototype);

let db = new Datastore({ filename: config.dataDir + '/db/devices.db', autoload: true });
db.persistence.setAutocompactionInterval(60 * 1000);

export default db;
