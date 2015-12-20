'use strict';

import {Promise} from 'bluebird';
let fs = Promise.promisifyAll(require('fs'));
import path from 'path';
import md5 from 'md5';
import ismyjsonvalid from 'is-my-json-valid';
import chokidar from 'chokidar';

import config from './config';
import mqtt from './mqtt';
import log from './log';

let manifestPath = path.join(config.dataDir, '/ota/manifest.json');

class Ota {
  constructor () {
    this.httpHandler = this._httpHandler.bind(this);

    this._loadManifest().then((manifest) => {
      this.manifest = manifest;
      if (this.manifest) {
        this._warnDevices();
      }
    });

    chokidar.watch(manifestPath).on('change', async () => {
      log.info('OTA manifest updated');

      this._loadManifest().then((manifest) => {
        this.manifest = manifest;
        if (this.manifest) {
          this._warnDevices();
        }
      });
    });
  }

  _warnDevices () {
    this.manifest.firmwares.forEach((firmware) => {
      firmware.devices.forEach((device) => {
        // Todo, publish with QoS
        mqtt.publish({
          cmd: 'publish',
          topic: `devices/${device}/$ota`,
          payload: firmware.version.toString(),
          retain: true
        });
      });
    });
  }

  async _loadManifest () {
    try {
      let rawManifest = await fs.readFileAsync(manifestPath);
      let manifest = JSON.parse(rawManifest);
      let valid = await this._validateManifest(manifest);
      if (!valid) {
        return null;
      }

      return manifest;
    } catch (err) {
      log.error('OTA manifest cannot be parsed');
      return null;
    }
  }

  _validateManifest (object) {
    return new Promise(function (resolve) {
      let validate = ismyjsonvalid({
        required: true,
        type: 'object',
        properties: {
          firmwares: {
            required: true,
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: {
                  required: true,
                  type: 'string'
                },
                version: {
                  required: true,
                  type: 'string'
                },
                devices: {
                  required: true,
                  type: 'array',
                  items: {
                    type: 'string'
                  }
                }
              }
            }
          }
        }
      });

      if (!validate(object)) {
        log.error('OTA manifest invalid');
        resolve(false);
      }

      // Check if all firmware binaries exist

      let errors = false;
      object.firmwares.forEach(async function (firmware, index) {
        try {
          await fs.accessAsync(`${config.dataDir}/ota/bin/${firmware.name}.bin`, fs.F_OK);
        } catch (err) {
          log.error(`Cannot find firmware ${config.dataDir}/ota/bin/${firmware.name}.bin`);
          errors = true;
        }

        if (index === object.firmwares.length - 1) {
          if (errors) {
            resolve(false);
          }

          resolve(true);
        }
      });
    });
  }

  latestDeviceFirmware (deviceId, version) {
    let deviceFirmware = null;
    this.manifest.firmwares.every((firmware) => {
      if (firmware.devices.indexOf(deviceId) > -1) {
        deviceFirmware = firmware;
        return false;
      }

      return true;
    });

    if (!deviceFirmware) {
      return false;
    }

    return deviceFirmware;
  }

  outdated (deviceId, version) {
    let firmware = this.latestDeviceFirmware(deviceId, version);

    if (!firmware) {
      return false;
    }

    return firmware.version !== version;
  }

  async _httpHandler (req, res) {
    if (req.get('User-Agent') !== 'ESP8266-http-Update' || !req.get('x-ESP8266-free-space') || !req.get('x-ESP8266-version')) {
      return res.sendStatus(403);
    }

    let deviceData = req.get('x-ESP8266-version');
    let deviceId = deviceData.split('=')[0];
    let deviceVersion = deviceData.split(/=(.+)/)[1];
    let freeBytes = parseInt(req.get('x-ESP8266-free-space'), 10);

    if (!this.outdated(deviceId, deviceVersion)) {
      return res.sendStatus(304);
    }

    let firmware = this.latestDeviceFirmware(deviceId, deviceVersion);
    let firmwarePath = `${config.dataDir}/ota/bin/${firmware.name}.bin`;
    let firmwareBuffer;
    try {
      let firmwareSize = await fs.statAsync(firmwarePath).size;
      if (firmwareSize > freeBytes) {
        log.error('OTA aborted, not enough free space on device', { deviceId: deviceId });
        return res.sendStatus(304);
      }

      firmwareBuffer = await fs.readFileAsync(firmwarePath);
    } catch (err) {
      log.error(`OTA aborted, cannot access firmware ${firmwarePath}`, { deviceId: deviceId });
      return res.sendStatus(304);
    }
    let firmwareMd5 = md5(firmwareBuffer);
    res.set('x-MD5', firmwareMd5);

    log.info('OTA update started', { deviceId: deviceId, version: firmware.version });

    return res.sendFile(path.resolve(firmwarePath)); // path resolve else with relative path express might cry
  }
}

export default new Ota();
