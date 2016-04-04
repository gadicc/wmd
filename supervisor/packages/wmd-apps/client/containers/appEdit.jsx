import React, { Component } from 'react';
import { reduxForm, reset } from 'redux-form'
import { composeWithTracker } from 'mantra-core';
import { connect } from 'react-redux';

import { Apps } from '../configs/context.js';
import { services } from 'meteor/wmd-services';

import actions from '../actions/appEdit.jsx';
import AppEdit from '../components/appEdit.jsx';

function composer(props, onData) {
  const app = Apps.findOne(props._id);
  onData(null, { ...props, app, actions, services });
}

const mapStateToProps = ({ appsEditAddServices }) => { return { appsEditAddServices }; };

export default connect(mapStateToProps)(composeWithTracker(composer)(AppEdit));

