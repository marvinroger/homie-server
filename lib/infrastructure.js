'use strict';

import Immutable from 'immutable';
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
    this._representation = Immutable.fromJS({ devices: {} });
  }

  async start () {
    return new Promise((resolve, reject) => {
      this._config = YAML.load(path.join(this.dataDir, '/infrastructure.yml'));
      this._representation = this._representation.set('groups', this._config.groups);

      this._devicesStorage = new DevicesStorage({ dataDir: this.dataDir });

      this._config.devices.forEach((device) => {
        device = Immutable.fromJS(device);
        let nodes = Immutable.Map();
        device.get('nodes').forEach((node) => {
          const nodeId = node.get('id');
          node = node.delete('id');
          node = node.set('state', Immutable.fromJS({ current: {}, wanted: {} }));
          nodes = nodes.set(nodeId, node);
        });
        this._representation = this._representation.setIn(['devices', device.get('id')], Immutable.fromJS({
          location: device.get('location'),
          color: device.get('color'),
          state: {
            online: false
          },
          nodes: nodes
        }));
      });

      // If devices don't exist in db let's create them, otherwise populate object

      this._representation.get('devices').forEach(async (device, deviceId) => {
        let doc = await this._devicesStorage.findDevice(deviceId);
        doc = Immutable.fromJS(doc);
        if (!doc) {
          let nodes = Immutable.Map();
          this._representation.get('devices').get(deviceId).get('nodes').forEach((node, id) => {
            node = node.delete('location');
            node = node.delete('name');
            nodes = nodes.set(id, node);
          });

          await this._devicesStorage.insertDevice({
            id: deviceId,
            state: device.get('state').toJS(),
            nodes: nodes.toJS()
          });
        } else {
          this._representation = this._representation.setIn(['devices', deviceId, 'state'], doc.get('state'));
          doc.get('nodes').forEach((node, nodeId) => {
            this._representation = this._representation.setIn(['devices', deviceId, 'nodes', nodeId, 'state'], node.get('state'));
          });
        }
      });

      // Handle MQTT inputs

      dispatcher.on('homieMessage', async (parsed) => {
        if (!this._representation.get('devices').get(parsed.deviceId)) {
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
              const online = parsed.property.value === 'true';
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
            case 'uptime':
              const uptime = parseInt(parsed.property.value, 10);
              await this._updateDeviceProperty({ deviceId: parsed.deviceId, property: parsed.property.name, value: uptime });
              log.debug(`${parsed.deviceId} uptime is ${uptime}s`);
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

        // implicit node property or set

        if (!this._representation.get('devices').get(parsed.deviceId).get('nodes').get(parsed.nodeId)) {
          log.debug(`node ${parsed.nodeId} of device ${parsed.deviceId} not registered`);
          return;
        }

        if (!propertyValidator.canReceive(this._representation.get('devices').get(parsed.deviceId).get('nodes').get(parsed.nodeId).get('type'), parsed.property.name, parsed.property.value)) {
          log.debug(`${parsed.deviceId} sent bad value`, {nodeId: parsed.nodeId, property: parsed.property.name, value: parsed.property.value});
          return;
        }

        let convertedValue = propertyValidator.convertValue(this._representation.get('devices').get(parsed.deviceId).get('nodes').get(parsed.nodeId).get('type'), parsed.property.name, parsed.property.value);

        if (parsed.type === SET_NODE_PROPERTY) {
          await this._updateWantedNodeProperty({ deviceId: parsed.deviceId, nodeId: parsed.nodeId, property: parsed.property.name, value: convertedValue });
          log.debug(`device ${parsed.deviceId} node ${parsed.nodeId} - ${parsed.property.name} wanted to ${convertedValue}`);
          return;
        }

        // implicit node property

        await this._updateCurrentNodeProperty({ deviceId: parsed.deviceId, nodeId: parsed.nodeId, property: parsed.property.name, value: convertedValue });
        log.debug(`device ${parsed.deviceId} node ${parsed.nodeId} - ${parsed.property.name} = ${convertedValue}`);
      });

      resolve();
    });
  }

  async _updateDeviceProperty (options) {
    this.emit('update', {
      type: 'deviceState',
      deviceId: options.deviceId,
      property: options.property,
      value: options.value
    });
    this._representation = this._representation.setIn(['devices', options.deviceId, 'state', options.property], options.value);
    await this._devicesStorage.updateDeviceState({ id: options.deviceId, name: options.property, value: options.value });
  }

  async _updateCurrentNodeProperty (options) {
    this.emit('update', {
      type: 'nodeCurrentState',
      deviceId: options.deviceId,
      nodeId: options.nodeId,
      property: options.property,
      value: options.value
    });
    this._representation = this._representation.setIn(['devices', options.deviceId, 'nodes', options.nodeId, 'state', 'current', options.property], options.value);
    await this._devicesStorage.updateCurrentNodeState({ deviceId: options.deviceId, nodeId: options.nodeId, name: options.property, value: options.value });
  }

  async _updateWantedNodeProperty (options) {
    this.emit('update', {
      type: 'nodeWantedState',
      deviceId: options.deviceId,
      nodeId: options.nodeId,
      property: options.property,
      value: options.value
    });
    this._representation = this._representation.setIn(['devices', options.deviceId, 'nodes', options.nodeId, 'state', 'wanted', options.property], options.value);
    await this._devicesStorage.updateWantedNodeState({ deviceId: options.deviceId, nodeId: options.nodeId, name: options.property, value: options.value });
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
    return this._representation.toJS();
  }
}

export default Infrastructure;
