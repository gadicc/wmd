import React, { Component } from 'react';
import { reduxForm, reset } from 'redux-form'
import { composeWithTracker } from 'mantra-core';
//import Dialog from 'react-toolbox/lib/dialog';

import AppList from '../components/appList.jsx';
import { Apps } from '../configs/context.js';
import ext from '../index.js';

function handleSubmit2({name}) {
  const { dispatch } = ext.appContext().Store;
  Apps.insert({name});
  dispatch(reset('app_new'));
}

function removeApp(app) {
  Apps.remove(app._id);
}

function composer(props, onData) {
  const apps = Apps.find().fetch();
  onData(null, {apps, handleSubmit2, removeApp});
}

const FormContainer = reduxForm({
  form: 'app_new',
  fields: [ 'name' ]
})(composeWithTracker(composer)(AppList));

export default FormContainer;

