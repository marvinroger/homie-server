/* global $ */

'use strict';

import React from 'react';

import classNames from 'classnames';

import InfrastructureActions from '../infrastructure-actions';

export default class Device extends React.Component {
  constructor (props) {
    super(props);
  }

  setProperty (name, value) {
    InfrastructureActions.setProperty({
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
    let signalLabelClasses = classNames({
      'device-status': true,
      'ui': true,
      'green': this.props.deviceState.online,
      'red': !this.props.deviceState.online,
      'corner': true,
      'label': true
    });

    let tooltipHtml = `
      <b>ID objet : </b> ${this.props.deviceId}<br>
      <b>Version objet : </b> ${this.props.deviceState.version ? this.props.deviceState.version : 'inconnue'}<br>
      <b>ID noeud : </b> ${this.props.nodeId}<br>
      <b>IP</b> : ${this.props.deviceState.localip ? this.props.deviceState.localip : 'inconnue'}
    `;

    return (
      <div className='ui column'>
        <div className='ui fluid card'>
          <div className='image'>
            <img src={typeof this.props.image !== 'undefined' ? `img/icons/${this.props.type}/${this.props.image}.png` : 'img/icons/common/unknown.png'} style={{backgroundColor: this.props.color, padding: '20px'}}/>
          </div>

          <div className='content'>
            <a className='header'>{ this.props.name }</a>
            <a className={signalLabelClasses} data-html={tooltipHtml} data-variation='inverted' data-position='left center'><i className='wifi icon' style={{marginRight: 0}}/></a>
            <div className='meta'>
              <span className='group'>{ this.props.location }</span>
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
  nodeId: React.PropTypes.string.isRequired,
  deviceState: React.PropTypes.shape({
    online: React.PropTypes.bool.isRequired,
    localip: React.PropTypes.string,
    version: React.PropTypes.version
  }).isRequired
};
