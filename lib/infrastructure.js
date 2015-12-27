'use strict';

import path from 'path';
import {EventEmitter} from 'events';
import jsonpatch from 'fast-json-patch';

import parser from './mqtt-parser';
import propertyValidator from './validators/property';
import devicesStorage from './storage/devices';
import log from './log';
import mqtt from './servers/homie';
import config from './config';

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
      let doc = await devicesStorage.findDevice(device.id);
      if (!doc) {
        let nodes = device.nodes.map((node) => {
          let kept = {
            id: node.id,
            type: node.type,
            state: node.state
          };
          return kept;
        });
        await devicesStorage.insertDevice({
          id: device.id,
          state: device.state,
          nodes: nodes
        });
      }
    });

    // Populate states from DB

    this._representation.devices.forEach(async (device, deviceIndex) => {
      let doc = await devicesStorage.findDevice(device.id);

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
      let parsed = parser.parse(topic, message);
      if (!parsed) {
        log.error('malformed MQTT message', {topic: topic, message: message});
        return;
      }

      if (parsed.type === 'set') {
        return;
      }

      let deviceIndex = null;
      this._representation.devices.every((iDevice, index) => {
        if (iDevice.id === parsed.deviceId) {
          deviceIndex = index;
          return false;
        }
        return true;
      });

      if (deviceIndex === null) {
        log.error(`device ${parsed.deviceId} not registered`);
        return;
      }

      if (parsed.type === 'deviceProperty') {
        switch (parsed.property.name) {
          case 'ota':
            break; // only for devices
          case 'online':
            let online = parsed.property.value === 'true';
            this._representation.devices[deviceIndex].state.online = online;
            await devicesStorage.updateDeviceState({ id: parsed.deviceId, name: 'online', value: online });
            log.debug(`${parsed.deviceId} is ${online ? 'online' : 'offline'}`);
            break;
          case 'localip':
            this._representation.devices[deviceIndex].state.localip = parsed.property.value;
            await devicesStorage.updateDeviceState({ id: parsed.deviceId, name: 'localip', value: parsed.property.value });
            log.debug(`${parsed.deviceId} IP is ${parsed.property.value}`);
            break;
          case 'nodes':
            break;
          case 'version':
            this._representation.devices[deviceIndex].state.version = parsed.property.value;
            await devicesStorage.updateDeviceState({ id: parsed.deviceId, name: 'version', value: parsed.property.value });
            log.debug(`${parsed.deviceId} version is ${parsed.property.value}`);
            break;
          default:
            log.error(`${parsed.deviceId} sent unknown device property`, {propertyName: parsed.property.name, propertyValue: parsed.property.value});
        }
        return;
      }

      // implicit node property

      let nodeIndex = null;
      this._representation.devices[deviceIndex].nodes.every((iNode, index) => {
        if (iNode.id === parsed.nodeId) {
          nodeIndex = index;
          return false;
        }
        return true;
      });

      if (nodeIndex === null) {
        log.error(`node ${parsed.nodeId} of device ${parsed.deviceId} not registered`);
        return;
      }

      if (!propertyValidator.canReceive(this._representation.devices[deviceIndex].nodes[nodeIndex].type, parsed.property.name, parsed.property.value)) {
        log.error(`${parsed.deviceId} sent bad value`, {nodeId: parsed.nodeId, property: parsed.property.name, value: parsed.property.value});
        return;
      }

      let convertedValue = propertyValidator.convertValue(this._representation.devices[deviceIndex].nodes[nodeIndex].type, parsed.property.name, parsed.property.value);

      this._representation.devices[deviceIndex].nodes[nodeIndex].state[parsed.property.name] = convertedValue;
      await devicesStorage.updateNodeState({ deviceId: parsed.deviceId, nodeId: parsed.nodeId, name: parsed.property.name, value: convertedValue });
      log.debug(`device ${parsed.deviceId} node ${parsed.nodeId} - ${parsed.property.name} = ${convertedValue}`);
    });
  }

  sendProperty (options) {
    let deviceId = options.deviceId;
    let nodeId = options.nodeId;
    let property = options.property;
    let value = options.value;
    let qos = options.qos || 2;
    let retain = options.retain || true;

    mqtt.publish({
      topic: `devices/${deviceId}/${nodeId}/${property}/set`,
      payload: value.toString(),
      qos: qos,
      retain: retain
    });
  }

  getRepresentation () {
    return this._representation;
  }
}

export default new Infrastructure();
