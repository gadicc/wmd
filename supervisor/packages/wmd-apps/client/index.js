import Extension from 'meteor/wmd-extensions';
import ExtensionHost from 'extensions';

import React, { Component } from 'react';
import { connect } from 'react-redux';

import AppList from './containers/appList.jsx';
import AppEdit from './containers/appEdit.jsx';

import reducers from './reducers';

const AppRouter = ({_id}) => (
  <If condition={_id}>
    <AppEdit _id={_id} />
  <Else />
    <AppList />
  </If>
);

var ext = new Extension({
  name: 'wmd-apps'
});

ext.addTab('apps', "Apps",
  connect(state => ({ _id: state.route.params._id }))(AppRouter));

var routes = undefined;
var actions = undefined;

ext.loadModule({
  routes,
  actions,
  load(context) {
    // console.log('wmd-apps mantra module loaded');

    for (let key in reducers)
      context.Reducers.add(key, reducers[key]);

    //methodStubs(context);
  }
});

export default ext;