'use strict';

import Database from './database';

class DevicesStorage extends Database {
  constructor (options) {
    super({ dbName: 'devices', dataDir: options.dataDir });
  }

  findDevice (id) {
    return super.db.findOneAsync({ _id: id });
  }

  insertDevice (options) {
    return super.db.insertAsync({
      _id: options.id,
      state: options.state,
      nodes: options.nodes
    });
  }

  updateDeviceState (options) {
    let changes = {};
    changes[`state.${options.name}`] = options.value; // {`${test}`: true} is not doable
    return super.db.updateAsync({ _id: options.id }, { $set: changes });
  }

  async updateNodeState (options) {
    let changes = {};
    changes[`nodes.${options.nodeId}.state.${options.name}`] = options.value;
    return super.db.updateAsync({ _id: options.deviceId }, { $set: changes });
  }
}

export default DevicesStorage;
