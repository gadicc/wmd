import React, { Component } from 'react';
import { reduxForm, reset } from 'redux-form'
import { composeWithTracker } from 'mantra-core';
//import Dialog from 'react-toolbox/lib/dialog';

import AppEdit from '../components/appEdit.jsx';
import { Apps } from '../configs/context.js';
import ext from '../index.js';

const actions = {
  back() {
    const { FlowRouter } = ext.appContext();
    FlowRouter.go('/apps');
  }
}

function composer(props, onData) {
  const app = Apps.findOne(props._id);
  onData(null, {app, actions});
}

export default composeWithTracker(composer)(AppEdit);

