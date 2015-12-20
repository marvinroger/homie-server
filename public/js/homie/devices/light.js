'use strict';

import React from 'react';

import Device from '../device';

export default class Light extends React.Component {
  constructor (props) {
    super(props);
  }

  toggle (value) {
    this.refs['device'].setProperty('on', value);
  }

  render () {
    return (
      <Device image={typeof this.props.state.on === 'undefined' ? undefined : this.props.state.on ? 'on' : 'off'} color='#ea6153' ref='device' {...this.props}>
        <div className='ui two buttons'>
          <button className='ui basic green icon compact button' onClick={() => this.toggle('true')}>
            <i className='toggle on icon'></i><br/>
            ON
          </button>
          <button className='ui basic red icon compact button' onClick={() => this.toggle('false')}>
            <i className='toggle off icon'></i><br/>
            OFF
          </button>
        </div>
      </Device>
    );
  }
}

Light.propTypes = {
  state: React.PropTypes.shape({
    on: React.PropTypes.bool
  })
};
