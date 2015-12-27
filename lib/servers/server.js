'use strict';

import {EventEmitter} from 'events';

class Server extends EventEmitter {
  constructor (name) {
    super();

    this.name = name;
  }

  getName () {
    return this.name;
  }
}

export default Server;
