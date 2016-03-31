import React, { Component } from 'react';
import AppBar from 'react-toolbox/lib/app_bar';
import {Button, IconButton} from 'react-toolbox/lib/button';
import FontIcon from 'react-toolbox/lib/font_icon';

const AppEdit = ({ app, actions }) => (
  <div>
    <AppBar>
      <span style={{color:'white'}}>
        <Button mini onClick={actions.back}>
          <i className="material-icons md-36 md-light">arrow_back</i>
        </Button>
      </span>
      <h3>{app.name}</h3>
    </AppBar>
  </div>
);

export default AppEdit;
