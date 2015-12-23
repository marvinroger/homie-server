/* global $ */

'use strict';

import React from 'react';
import classNames from 'classnames';

export default class Menu extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      active: { id: 'all', name: 'Tout' }
    };
  }

  componentDidMount () {
    $('.ui.dropdown').dropdown();
  }

  componentDidUpdate () {
    $('.ui.dropdown').dropdown();
  }

  onMenuChange (group) {
    this.props.onMenuChange(group);
    this.setState({ active: group });
  }

  render () {
    let groupsWithAll = this.props.groups.slice(0); // needed to clone, else it modifies original props
    groupsWithAll.unshift({ id: 'all', 'name': 'Tout' });

    let groups = groupsWithAll.map((group, index) => {
      let itemClasses = classNames({
        'item': true,
        'active': this.state.active.id === group.id
      });

      return (
        <a className={ itemClasses } onClick={() => this.onMenuChange(group)} key={index}>
          {group.name}
        </a>
      );
    });

    let errorMessage;
    if (!this.props.connection) {
      errorMessage = <div className='ui icon negative message'>
        <i className='notched circle loading icon'></i>
        <div className='content'>
          <div className='header'>
            Connexion instable
          </div>
          <p>Les données ci-dessous ne sont peut-être plus à jour. Nous tentons de rétablir la situation.</p>
        </div>
      </div>;
    }

    return (
      <div>
        {errorMessage}
        <div className='ui centered grid'>
          <div className='center aligned column'>
            <div className='ui compact text menu'>
              <div className='item'>
                <img className='logo' src='img/logo.png'/>
                Homie
              </div>
            </div>
          </div>
        </div>
        Groupe&nbsp;&nbsp;
        <div className='ui dropdown floating labeled icon button'>
          {this.state.active.name} <i className='filter icon'></i>
          <div className='menu'>
            {groups}
          </div>
        </div>
        <br/><br/>
      </div>
    );
  }
}

Menu.propTypes = {
  connection: React.PropTypes.bool.isRequired,
  groups: React.PropTypes.array.isRequired,
  onMenuChange: React.PropTypes.func.isRequired
};
