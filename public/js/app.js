'use strict';

import React from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';

import InfrastructureStore from './infrastructure-store';
import InfrastructureActions from './infrastructure-actions';

import Menu from './homie/menu';
import DeviceContainer from './homie/device-container';

class App extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      loading: true,
      devices: [],
      groups: [],
      devicesShown: 'all'
    };
  }

  onInfrastructureChange (infrastructure) {
    this.setState({
      loading: false,
      devices: infrastructure.devices,
      groups: infrastructure.groups
    });
  }

  componentDidMount () {
    InfrastructureActions.getInfrastructure();
    this.unsubscribe = InfrastructureStore.listen((data) => this.onInfrastructureChange(data));
  }

  componentWillUnmount () {
    this.unsubscribe();
  }

  onGroupChange (group) {
    if (group.id === 'all') {
      this.setState({ devicesShown: 'all' });
    } else {
      let groupWithDevices = this.state.groups.filter((testedGroup) => {
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
      'active': this.state.loading
    });

    return (
      <div>
        <div className={ dimmerClasses } id='loading'>
          <div className='ui text loader'>Chargement</div>
        </div>

        <div className='ui main container'>
          <Menu groups={this.state.groups} onMenuChange={this.onGroupChange.bind(this)} />
          <DeviceContainer devicesShown={this.state.devicesShown} devices={this.state.devices} />
        </div>
      </div>
    );
  }
}

ReactDOM.render(<App/>, document.getElementById('app'));
