'use strict';

let jsonpatch = require('fast-json-patch');
let EventEmitter = require('events').EventEmitter;
let propertyValidator = require('./property-validator');
let db = require('./db');
let log = require('./log');
let mqtt = require('./mqtt');

let path = require('path');
let config = require('./config');

class Infrastructure extends EventEmitter {
  constructor () {
    super();
    this._config = require(path.join(config.dataDir, '/infrastructure.json'));
    this._representation = { devices: [] };
    this._representation.groups = this._config.groups;

    this._config.devices.forEach((device) => {
      let nodes = device.nodes.map((node) => {
        node.state = {};
        return node;
      });
      this._representation.devices.push({
        id: device.id,
        name: device.name,
        location: device.location,
        state: {
          online: false
        },
        nodes: nodes
      });
    });

    // If devices don't exist in db let's create them

    this._representation.devices.forEach(async (device, deviceIndex) => {
      let doc = await db.findOneAsync({ _id: device.id });
      if (!doc) {
        let nodes = device.nodes.map((node) => {
          let kept = {
            id: node.id,
            type: node.type,
            state: node.state
          };
          return kept;
        });
        await db.insertAsync({
          _id: device.id,
          state: device.state,
          nodes: nodes
        });
      }
    });

    // Populate states from DB

    this._representation.devices.forEach(async (device, deviceIndex) => {
      let doc = await db.findOneAsync({ _id: device.id });

      this._representation.devices[deviceIndex].state = doc.state;
      doc.nodes.forEach((node, nodeIndex) => {
        let isNodeInDevice = this._representation.devices[deviceIndex].nodes.filter((nodeInDevice) => node.id === nodeInDevice.id)[0];
        if (!isNodeInDevice) {
          return;
        }

        this._representation.devices[deviceIndex].nodes[nodeIndex].state = node.state;
      });
    });

    // Observe for changes

    jsonpatch.observe(this._representation, (patch) => {
      this.emit('update', patch);
    });

    // Handle MQTT inputs

    mqtt.on('message', async (topic, message) => {
      let path = topic.split('/');
      if (path.length < 3 || path.length > 4) { // devices(1)/${deviceId}(2)/${status}(3)...
        if (path.length === 5 && path[4] === 'set') {
          return;
        }

        log.error('malformed MQTT message', {topic: topic, message: message.toString()});
        return;
      }
      let deviceId = path[1];
      let isSpecial = path[2].startsWith('$');
      let special;
      let nodeId;
      let property;
      if (isSpecial) {
        if (path.length !== 3) {
          log.error('malformed MQTT special message', {topic: topic, message: message.toString()});
          return;
        }

        special = path[2].substring(1);
      } else {
        nodeId = path[2];
        property = path[3];
      }

      let deviceIndex = null;
      this._representation.devices.every((iDevice, index) => {
        if (iDevice.id === deviceId) {
          deviceIndex = index;
          return false;
        }
        return true;
      });

      if (deviceIndex === null) {
        log.error('device not registered', {deviceId: deviceId});
        return;
      }

      if (isSpecial) {
        switch (special) {
          case 'ota':
            break; // only for devices
          case 'online':
            let online = message === 'true';
            this._representation.devices[deviceIndex].state.online = online;
            await db.updateAsync({ _id: deviceId }, { $set: { 'state.online': online } });
            log.debug(`device is ${online ? 'online' : 'offline'}`, {deviceId: deviceId});
            break;
          case 'localip':
            this._representation.devices[deviceIndex].state.localip = message;
            await db.updateAsync({ _id: deviceId }, { $set: { 'state.localip': message } });
            log.debug(`device IP is ${message}`, {deviceId: deviceId});
            break;
          case 'nodes':
            break;
          case 'version':
            this._representation.devices[deviceIndex].state.version = message;
            await db.updateAsync({ _id: deviceId }, { $set: { 'state.version': message } });
            log.debug(`device version is ${message}`, {deviceId: deviceId});
            break;
          default:
            log.error(`device sent unknown special message`, {deviceId: deviceId, special: special, message: message});
        }
        return;
      }

      let nodeIndex = null;
      this._representation.devices[deviceIndex].nodes.every((iNode, index) => {
        if (iNode.id === nodeId) {
          nodeIndex = index;
          return false;
        }
        return true;
      });

      if (nodeIndex === null) {
        log.error('node not registered', {deviceId: deviceId, nodeId: nodeId});
        return;
      }

      if (!propertyValidator.canReceive(this._representation.devices[deviceIndex].nodes[nodeIndex].type, property, message)) {
        log.error('device sent bad value', {deviceId: deviceId, nodeId: nodeId, property: property, value: message});
        return;
      }

      let convertedValue = propertyValidator.convertValue(this._representation.devices[deviceIndex].nodes[nodeIndex].type, property, message);

      this._representation.devices[deviceIndex].nodes[nodeIndex].state[property] = convertedValue;
      let doc = await db.findOneAsync({ _id: deviceId });
      let nodeIndexInDb;
      doc.nodes.every((iNode, index) => {
        if (iNode.id === nodeId) {
          nodeIndexInDb = index;
          return false;
        }
        return true;
      });
      let update = {};
      update[`nodes.${nodeIndexInDb}.state.${property}`] = convertedValue;
      await db.updateAsync({ _id: deviceId }, { $set: update });
      log.debug(`${property} = ${convertedValue}`, {deviceId: deviceId, nodeId: nodeId});
    });
  }

  sendProperty (options) {
    let deviceId = options.deviceId;
    let nodeId = options.nodeId;
    let property = options.property;
    let value = options.value;
    // let qos = options.qos || 2;
    let retain = options.retain || true;

    // Todo: implement QoS
    mqtt.publish({
      cmd: 'publish',
      topic: `devices/${deviceId}/${nodeId}/${property}/set`,
      payload: value.toString(),
      retain: retain
    });
  }

  getRepresentation () {
    return this._representation;
  }
}

module.exports = new Infrastructure();
