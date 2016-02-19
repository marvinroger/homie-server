'use strict';

// import log from './log';

class MqttParser {
  parse (topic, message) {
    let path = topic.split('/');

    // Must start with devices

    if (path[0] !== 'devices') {
      return false;
    }

    /*
    valid messages:
    - devices/testdevice/$fwname
    - devices/testdevice/node/property
    - devices/testdevice/node/property/set
    */

    if (path.length < 3 || path.length > 5) {
      return false;
    }

    // Check if deviceId only [a-z0-9\-]
    for (let i = 0; i < path[1].length; i++) {
      if (!((path[1][i] >= 'a' && path[1][i] <= 'z') || (path[1][i] >= '0' && path[1][i] <= '9') || path[1][i] === '-')) {
        return false;
      }
    }
    // Check if deviceId doesn't start or end with '-'
    if (path[1][0] === '-' || path[1][path[1].length - 1] === '-') { return false; }

    // Device property

    if (path.length === 3) {
      if (!path[2].startsWith('$')) {
        return false;
      }

      return {
        type: 'deviceProperty',
        deviceId: path[1],
        property: {
          name: path[2].substring(1),
          value: message
        }
      };
    } else if (path.length === 4) {
      if (path[2].startsWith('$') || path[3].startsWith('$') || path[3] === 'set') {
        return false;
      }

      return {
        type: 'nodeProperty',
        deviceId: path[1],
        nodeId: path[2],
        property: {
          name: path[3],
          value: message
        }
      };
    } else if (path.length === 5) {
      if (path[4] !== 'set') {
        return false;
      }

      return {
        type: 'set'
      };
    }
  }
}

export default new MqttParser();
