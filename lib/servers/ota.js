'use strict';

const PORT = 35590;

import pauseable from 'pauseable';
import YAML from 'yamljs';
import {createServer} from 'http';
import express from 'express';
import {Promise} from 'bluebird';
let fs = Promise.promisifyAll(require('fs'));
import path from 'path';
import md5 from 'md5';
import chokidar from 'chokidar';

import dispatcher from '../dispatcher';
import Server from './server';
import dataValidator from '../validators/datadir';
import log from '../log';

class OtaServer extends Server {
  constructor (options) {
    super('OTA');

    this.dataDir = options.dataDir;
    this.manifestPath = path.join(this.dataDir, '/ota/manifest.yml');

    this.app = express();
    this.server = createServer(this.app);
    this.app.use('/ota', this._httpHandler);
  }

  start () {
    this.server.listen(PORT, () => {
      let host = this.server.address().address;
      let port = this.server.address().port;
      this.emit('ready', { host: host, port: port });
    }).on('error', (err) => {
      this.emit('error', err);
    });

    let watcher = chokidar.watch(this.manifestPath);
    pauseable.pause(watcher); // Buffer events until dispatcher is ready
    dispatcher.on('ready', () => {
      pauseable.resume(watcher);

      this._loadManifest().then((manifest) => {
        this.manifest = manifest;
        if (this.manifest) {
          this._warnDevices();
        }
      });
    });

    watcher.on('change', async () => {
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
        dispatcher.publishMqttMessage({
          cmd: 'publish',
          topic: `devices/${device}/$ota`,
          payload: firmware.version.toString(),
          qos: 1, // QoS 2 sub not working on esp8266
          retain: true
        });
      });
    });
  }

  async _loadManifest () {
    try {
      let rawManifest = await fs.readFileAsync(this.manifestPath);
      let manifest = YAML.parse(rawManifest.toString());
      let valid = await dataValidator.validateOtaManifest(manifest, this.dataDir);
      if (!valid) {
        return null;
      }

      return manifest;
    } catch (err) {
      log.error('OTA manifest cannot be parsed');
      return null;
    }
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
    let firmwarePath = `${this.dataDir}/ota/firmwares/${firmware.name}.bin`;
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

export default OtaServer;
