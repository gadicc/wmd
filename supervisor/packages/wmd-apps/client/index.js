import Extension from 'meteor/wmd-extensions';
import ExtensionHost from 'extensions';

//import React from 'react';
import { connect } from 'react-redux';

import { Apps } from './context'
import OrigAppList from './components/appList';
import AppEdit from './components/appEdit';

import reducers from './reducers';

import React, { Component } from 'react';
import deepForceUpdate from 'react-deep-force-update';
const ComponentUpdater = (component) => {
  class ComponentUpdater extends Component {
    static instances = new Set();

    static updateWith(component) {
      for (let instance of ComponentUpdater.instances)
        instance.setState({ component })
    }

    constructor(props) {
      super(props);
      this.state = { component };
      ComponentUpdater.instances.add(this);
    }

    componentDidUpdate(prevProps, prevState) {
      if (prevState.component !== this.state.component)
        deepForceUpdate(this);
    }

    componentWillUnmount() {
      ComponentUpdater.instances.delete(this);
    }

    render() {
      const ComposedComponent = this.state.component;
      return ( <ComposedComponent {...this.props} /> );
    }
  }
  return ComponentUpdater;
}

const AppList = ComponentUpdater(OrigAppList);

if (module.hot) {
  module.hot.accept('./components/appList', function() {
    const nextAppList = require('./components/appList').default;
    AppList.updateWith(nextAppList);
  });
}

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

var eh = new ExtensionHost('wmd-apps');
var ee = eh.export();

ee.prototype.Apps = Apps;

export { ext };
export default ee;