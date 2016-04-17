/* global $ */

'use strict';

import React from 'react';

import classNames from 'classnames';

import {secondsToDurationString} from '../helpers';

export default class Device extends React.Component {
  constructor (props) {
    super(props);
  }

  setProperty (name, value) {
    this.props.setProperty({
      deviceId: this.props.deviceId,
      nodeId: this.props.nodeId,
      property: name,
      value: value
    });
  }

  componentDidMount () {
    $('.device-status').popup();
  }

  componentDidUpdate () {
    $('.device-status').popup(); // Else tooltip not refreshed
  }

  render () {
    let nodeInWantedState = true;
    Object.keys(this.props.state.wanted).forEach((property) => {
      if (this.props.state.current[property] !== this.props.state.wanted[property]) {
        nodeInWantedState = false;
      }
    });
    let signalLabelClasses = classNames({
      'device-status': true,
      'ui': true,
      'green': this.props.deviceState.online,
      'red': !this.props.deviceState.online,
      'corner': true,
      'label': true
    });

    let tooltipHtml = `
      <b>Nom objet : </b> ${this.props.deviceState.name ? this.props.deviceState.name : 'inconnu'}<br>
      <b>ID objet : </b> ${this.props.deviceId}<br>
      <b>Firmware objet : </b> ${this.props.deviceState.fwname ? this.props.deviceState.fwname + (this.props.deviceState.fwversion ? ' (' + this.props.deviceState.fwversion + ')' : '') : 'inconnu'}<br>
      <b>ID noeud : </b> ${this.props.nodeId}<br>
      <b>Signal</b> : ${this.props.deviceState.signal ? this.props.deviceState.signal + '%' : 'inconnu'}<br>
      <b>Uptime</b> : ${this.props.deviceState.uptime ? secondsToDurationString(this.props.deviceState.uptime) : 'inconnu'}<br>
      <b>IP</b> : ${this.props.deviceState.localip ? this.props.deviceState.localip : 'inconnue'}
    `;

    return (
      <div className='ui column'>
        <div className='ui fluid card' style={{overflow: 'hidden'}}>
          <div className='image'>
            <img src={typeof this.props.image !== 'undefined' ? `img/icons/${this.props.type}/${this.props.image}.png` : 'img/icons/common/unknown.png'} style={{backgroundColor: this.props.nodeColor || this.props.deviceColor || this.props.groupColor || this.props.color, padding: '20px'}}/>
          </div>

          <div className='content'>
            <a className='header'>{ this.props.name }</a>
            {(() => {
              if (!nodeInWantedState) {
                return <a className='ui white left corner label'><i className='refresh icon'/></a>;
              }
            })()}
            {
            }
            <a className={signalLabelClasses} data-html={tooltipHtml} data-variation='inverted' data-position='left center'><i className='wifi icon'/></a>
            <div className='meta'>
              <i className='marker icon'></i><span className='group'>{ this.props.location }</span>
            </div>
          </div>
          <div className='extra content'>
            { this.props.children }
          </div>
        </div>
      </div>
    );
  }
}

Device.propTypes = {
  type: React.PropTypes.string.isRequired,
  image: React.PropTypes.oneOfType([ React.PropTypes.string, React.PropTypes.number ]),
  color: React.PropTypes.string.isRequired,
  name: React.PropTypes.string.isRequired,
  location: React.PropTypes.string.isRequired,
  children: React.PropTypes.object.isRequired,
  deviceId: React.PropTypes.string.isRequired,
  deviceColor: React.PropTypes.string,
  nodeId: React.PropTypes.string.isRequired,
  nodeColor: React.PropTypes.string,
  groupColor: React.PropTypes.string,
  state: React.PropTypes.shape({
    current: React.PropTypes.object.isRequired,
    wanted: React.PropTypes.object.isRequired
  }).isRequired,
  deviceState: React.PropTypes.shape({
    online: React.PropTypes.bool.isRequired,
    name: React.PropTypes.string,
    fwname: React.PropTypes.string,
    fwversion: React.PropTypes.string,
    signal: React.PropTypes.number,
    uptime: React.PropTypes.number,
    localip: React.PropTypes.string,
    version: React.PropTypes.version
  }).isRequired,
  setProperty: React.PropTypes.func.isRequired
};
