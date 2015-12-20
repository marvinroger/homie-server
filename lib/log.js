'use strict';

import bunyan from 'bunyan';

let log = bunyan.createLogger({ name: 'homie', level: 'debug' });

export default log;
