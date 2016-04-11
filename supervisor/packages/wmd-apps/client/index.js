import Extension from 'meteor/wmd-extensions';
// import ExtensionHost from 'extensions';

import React from 'react';
import { connect } from 'react-redux';

import AppList from './components/appList';
import AppEdit from './components/appEdit';

import reducers from './reducers';

const AppRouter = ({_id, action}) => (
  <If condition={_id}>
    <If condition={action==='edit'}>
      <AppEdit _id={_id} />
    <Else />
      <div>Coming soon</div>
    </If>
  <Else />
    <AppList />
  </If>
);

AppRouter.propTypes = {
  _id: React.PropTypes.string,
  action: React.PropTypes.string
};

var ext = new Extension({
  name: 'wmd-apps'
});

ext.addTab('apps', "Apps",
  connect(state => ({ _id: state.route.params._id, action: state.route.params.action }))(AppRouter));

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