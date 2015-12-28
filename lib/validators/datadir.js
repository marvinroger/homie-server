'use strict';

import {Promise} from 'bluebird';
let fs = Promise.promisifyAll(require('fs'));
import ismyjsonvalid from 'is-my-json-valid';

import propertyValidator from './property';
import config from '../config';
import log from '../log';

class DataDirValidator {
  async validateOtaManifest (object, checkForBinary = true) {
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
        return resolve(false);
      }

      // Check if a device is referenced multiple times

      let deviceIds = object.firmwares.map(function (device) {
        return device.id;
      });

      if ((new Set(deviceIds)).size !== deviceIds.length) {
        log.error('OTA manifest references multiple firmwares for a single device');
        return resolve(false);
      }

      if (!checkForBinary) {
        return resolve(true);
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

  validateInfrastructure (object) {
    let validate = ismyjsonvalid({
      required: true,
      type: 'object',
      properties: {
        devices: {
          required: true,
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: {
                required: true,
                type: 'string'
              },
              name: {
                required: true,
                type: 'string'
              },
              location: {
                required: true,
                type: 'string'
              },
              nodes: {
                required: true,
                type: 'array',
                minItems: 1,
                items: {
                  type: 'object',
                  properties: {
                    type: {
                      required: true,
                      type: 'string'
                    },
                    id: {
                      required: true,
                      type: 'string'
                    },
                    name: {
                      required: true,
                      type: 'string'
                    }
                  }
                }
              }
            }
          }
        },
        groups: {
          required: true,
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: {
                required: true,
                type: 'string'
              },
              name: {
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
      log.error('infrastructure.yml invalid');
      return false;
    }

    // Check if there are no duplicates device ids
    let deviceIds = object.devices.map(function (device) {
      return device.id;
    });

    if ((new Set(deviceIds)).size !== deviceIds.length) {
      log.error('infrastructure.yml contains duplicate devices');
      return false;
    }

    // Check if there are no duplicates node ids
    let duplicateNodes = false;
    object.devices.forEach(function (device) {
      // Check if there are no duplicates device ids
      let nodeIds = device.nodes.map(function (node) {
        return node.id;
      });

      if ((new Set(nodeIds)).size !== nodeIds.length) {
        duplicateNodes = true;
      }
    });

    if (duplicateNodes) {
      log.error('infrastructure.yml contains duplicate nodes');
      return false;
    }

    // Check if there are no duplicates group ids
    let groupsIds = object.groups.map(function (group) {
      return group.id;
    });

    if ((new Set(groupsIds)).size !== groupsIds.length) {
      log.error('infrastructure.yml contains duplicate groups');
      return false;
    }

    // Check if all devices in group exist
    let devicesExist = true;
    object.groups.forEach(function (group) {
      group.devices.forEach(function (deviceId) {
        if (deviceIds.indexOf(deviceId) <= -1) {
          devicesExist = false;
        }
      });
    });

    if (!devicesExist) {
      log.error('infrastructure.yml groups reference non-existent devices');
      return false;
    }

    // Check if all node types are valid
    let nodeTypesValid = true;
    object.devices.forEach(function (device) {
      device.nodes.forEach(function (node) {
        if (!propertyValidator.typeExists(node.type)) {
          nodeTypesValid = false;
        }
      });
    });

    if (!nodeTypesValid) {
      log.error('infrastructure.yml contains invalid node types');
      return false;
    }

    return true;
  }
}

export default new DataDirValidator();
