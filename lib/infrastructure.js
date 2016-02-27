'use strict';

import YAML from 'yamljs';
import path from 'path';
import {EventEmitter} from 'events';

import {DEVICE_PROPERTY, SET_NODE_PROPERTY} from './mqtt-parser';
import propertyValidator from './validators/property';
import DevicesStorage from './storage/devices';
import log from './log';
import dispatcher from './dispatcher';

class Infrastructure extends EventEmitter {
  constructor (options) {
    super();

    this.dataDir = options.dataDir;
  }

  async start () {
    return new Promise((resolve, reject) => {
      this._config = YAML.load(path.join(this.dataDir, '/infrastructure.yml'));
      this._representation = { devices: {} };
      this._representation.groups = this._config.groups;

      this._devicesStorage = new DevicesStorage({ dataDir: this.dataDir });

      this._config.devices.forEach((device) => {
        let nodes = {};
        device.nodes.forEach((node) => {
          const nodeId = node.id;
          delete node.id;
          node.state = {};
          nodes[nodeId] = node;
        });
        this._representation.devices[device.id] = {
          location: device.location,
          color: device.color,
          state: {
            online: false
          },
          nodes: nodes
        };
      });

      // If devices don't exist in db let's create them, otherwise populate object

      Object.keys(this._representation.devices).forEach(async (deviceId) => {
        let doc = await this._devicesStorage.findDevice(deviceId);
        if (!doc) {
          let nodes = {};
          Object.keys(this._representation.devices[deviceId].nodes).forEach((nodeId) => {
            nodes[nodeId] = this._representation.devices[deviceId].nodes[nodeId];
            delete nodes[nodeId].location;
            delete nodes[nodeId].name;
          });

          await this._devicesStorage.insertDevice({
            id: deviceId,
            state: this._representation.devices[deviceId].state,
            nodes: nodes
          });
        } else {
          this._representation.devices[deviceId].state = doc.state;
          Object.keys(doc.nodes).forEach((nodeId) => {
            this._representation.devices[deviceId].nodes[nodeId].state = doc.nodes[nodeId].state;
          });
        }
      });

      // Handle MQTT inputs

      dispatcher.on('homieMessage', async (parsed) => {
        if (parsed.type === SET_NODE_PROPERTY) {
          return;
        }

        if (!this._representation.devices[parsed.deviceId]) {
          log.debug(`device ${parsed.deviceId} not registered`);
          return;
        }

        if (parsed.type === DEVICE_PROPERTY) {
          switch (parsed.property.name) {
            case 'ota':
              break; // only for devices
            case 'reset':
              break; // only for devices
            case 'online':
              let online = parsed.property.value === 'true';
              await this._updateDeviceProperty({ deviceId: parsed.deviceId, property: parsed.property.name, value: online });
              log.debug(`${parsed.deviceId} is ${online ? 'online' : 'offline'}`);
              break;
            case 'name':
              await this._updateDeviceProperty({ deviceId: parsed.deviceId, property: parsed.property.name, value: parsed.property.value });
              log.debug(`${parsed.deviceId} name is ${parsed.property.value}`);
              break;
            case 'signal':
              const signal = parseInt(parsed.property.value, 10);
              await this._updateDeviceProperty({ deviceId: parsed.deviceId, property: parsed.property.name, value: signal });
              log.debug(`${parsed.deviceId} signal is ${signal}%`);
              break;
            case 'fwname':
              await this._updateDeviceProperty({ deviceId: parsed.deviceId, property: parsed.property.name, value: parsed.property.value });
              log.debug(`${parsed.deviceId} firmware name is ${parsed.property.value}`);
              break;
            case 'fwversion':
              await this._updateDeviceProperty({ deviceId: parsed.deviceId, property: parsed.property.name, value: parsed.property.value });
              log.debug(`${parsed.deviceId} firmware version is ${parsed.property.value}`);
              break;
            case 'localip':
              await this._updateDeviceProperty({ deviceId: parsed.deviceId, property: parsed.property.name, value: parsed.property.value });
              log.debug(`${parsed.deviceId} IP is ${parsed.property.value}`);
              break;
            case 'nodes':
              break;
            default:
              log.debug(`${parsed.deviceId} sent unknown device property`, {propertyName: parsed.property.name, propertyValue: parsed.property.value});
          }
          return;
        }

        // implicit node property

        if (!this._representation.devices[parsed.deviceId].nodes[parsed.nodeId]) {
          log.debug(`node ${parsed.nodeId} of device ${parsed.deviceId} not registered`);
          return;
        }

        if (!propertyValidator.canReceive(this._representation.devices[parsed.deviceId].nodes[parsed.nodeId].type, parsed.property.name, parsed.property.value)) {
          log.debug(`${parsed.deviceId} sent bad value`, {nodeId: parsed.nodeId, property: parsed.property.name, value: parsed.property.value});
          return;
        }

        let convertedValue = propertyValidator.convertValue(this._representation.devices[parsed.deviceId].nodes[parsed.nodeId].type, parsed.property.name, parsed.property.value);

        await this._updateNodeProperty({ deviceId: parsed.deviceId, nodeId: parsed.nodeId, property: parsed.property.name, value: convertedValue });
        log.debug(`device ${parsed.deviceId} node ${parsed.nodeId} - ${parsed.property.name} = ${convertedValue}`);
      });

      resolve();
    });
  }

  async _updateDeviceProperty (options) {
    this.emit('update', {
      type: 'device',
      deviceId: options.deviceId,
      property: options.property,
      value: options.value
    });
    this._representation.devices[options.deviceId].state[options.property] = options.value;
    await this._devicesStorage.updateDeviceState({ id: options.deviceId, name: options.property, value: options.value });
  }

  async _updateNodeProperty (options) {
    this.emit('update', {
      type: 'node',
      deviceId: options.deviceId,
      nodeId: options.nodeId,
      property: options.property,
      value: options.value
    });
    this._representation.devices[options.deviceId].nodes[options.nodeId].state[options.property] = options.value;
    await this._devicesStorage.updateNodeState({ deviceId: options.deviceId, nodeId: options.nodeId, name: options.property, value: options.value });
  }

  sendProperty (options) {
    let deviceId = options.deviceId;
    let nodeId = options.nodeId;
    let property = options.property;
    let value = options.value;
    let qos = options.qos || 2;
    let retain = options.retain || true;

    dispatcher.publishMqttMessage({
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

export default Infrastructure;
