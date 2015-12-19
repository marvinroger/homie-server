'use strict';

let promisifyAll = require('bluebird').Promise.promisifyAll;
let fs = promisifyAll(require('fs'));
let path = require('path');
let md5 = require('md5');
let chokidar = require('chokidar');

let config = require('./config');

let manifestPath = path.join(`${config.dataDir}/ota/manifest.json`);
let manifest = require(manifestPath);
let mqtt = require('./mqtt');
let log = require('./log');

class Ota {
  constructor () {
    this.httpHandler = this._httpHandler.bind(this);

    this._warnDevices();
    chokidar.watch(manifestPath).on('change', async () => {
      log.info('OTA manifest was updated');
      let rawManifest = await fs.readFileAsync(manifestPath);
      manifest = JSON.parse(rawManifest);
      this._warnDevices();
    });
  }

  _warnDevices () {
    manifest.firmwares.forEach((firmware) => {
      firmware.devices.forEach((device) => {
        mqtt.publish(`devices/${device}/$ota`, firmware.version.toString(), { qos: 2, retain: true });
      });
    });
  }

  latestDeviceFirmware (deviceId, version) {
    let deviceFirmware = null;
    manifest.firmwares.every((firmware) => {
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
    let firmwareSize = await fs.statAsync(firmwarePath).size;
    if (firmwareSize > freeBytes) {
      log.error('OTA aborted, not enough free space on device', { deviceId: deviceId });
      return res.sendStatus(304);
    }

    let firmwareBuffer = await fs.readFileAsync(firmwarePath);
    let firmwareMd5 = md5(firmwareBuffer);
    res.set('x-MD5', firmwareMd5);

    log.info('OTA update started', { deviceId: deviceId, version: firmware.version });

    return res.sendFile(path.resolve(firmwarePath)); // path resolve else with relative .. express cries
  }
}

module.exports = new Ota();
