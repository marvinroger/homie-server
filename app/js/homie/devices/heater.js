'use strict';

import React from 'react';

import Device from '../device';

export default class Heater extends React.Component {
  constructor (props) {
    super(props);
  }

  toggle (value) {
    this.refs['device'].setProperty('mode', value);
  }

  render () {
    return (
      <Device image={this.props.state.mode} color='#1abc9c' ref='device' {...this.props}>
        <div className='ui four buttons'>
          <button className='ui blue icon compact button' onClick={() => this.toggle('anti-freeze')}>
            <i className='asterisk icon'></i>
          </button>
          <button className='ui orange icon compact button' onClick={() => this.toggle('comfort')}>
            <i className='sun icon'></i>
          </button>
          <button className='ui purple icon compact button' onClick={() => this.toggle('economic')}>
            <i className='moon icon'></i>
          </button>
          <button className='ui black icon compact button' onClick={() => this.toggle('off')}>
            <i className='toggle off icon'></i>
          </button>
        </div>
      </Device>
    );
  }
}

Heater.propTypes = {
  state: React.PropTypes.shape({
    mode: React.PropTypes.string
  })
};
