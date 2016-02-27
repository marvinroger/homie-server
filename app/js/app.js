'use strict';

import React from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';

import { Provider, connect } from 'react-redux';
import store, {setProperty} from './store';

import Menu from './homie/menu';
import DeviceContainer from './homie/device-container';

@connect(state => ({
  devices: state.devices,
  groups: state.groups,
  loading: state.loading,
  connection: state.connection,
  mqttStatus: state.mqttStatus
}), (dispatch) => ({
  setProperty: (property) => dispatch(setProperty(property))
}))
class App extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      devicesShown: 'all'
    };
  }

  onGroupChange (group) {
    if (group.id === 'all') {
      this.setState({ devicesShown: 'all' });
    } else {
      let groupWithDevices = this.props.groups.filter((testedGroup) => {
        return testedGroup.id === group.id;
      });
      let devicesShown = groupWithDevices[0].devices;
      this.setState({ devicesShown: devicesShown });
    }
  }

  render () {
    let dimmerClasses = classNames({
      'ui': true,
      'dimmer': true,
      'active': this.props.loading
    });

    return (
      <div>
        <div className={ dimmerClasses } id='loading'>
          <div className='ui text loader'>Chargement</div>
        </div>

        <div className='ui main container'>
          <Menu groups={this.props.groups} connection={this.props.connection} onMenuChange={this.onGroupChange.bind(this)} />
          <DeviceContainer groups={this.props.groups} devicesShown={this.state.devicesShown} devices={this.props.devices} setProperty={this.props.setProperty} />
        </div>
      </div>
    );
  }
}

ReactDOM.render(
  <Provider store={store}>
    <App/>
  </Provider>,
  document.getElementById('app')
);

App.propTypes = {
  loading: React.PropTypes.bool.isRequired,
  devices: React.PropTypes.array.isRequired,
  groups: React.PropTypes.array.isRequired,
  connection: React.PropTypes.bool.isRequired,
  setProperty: React.PropTypes.func.isRequired
};
