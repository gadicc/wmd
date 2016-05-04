import 'react-hot-loader/patch';
import { render } from 'react-dom';

import { Meteor } from 'meteor/meteor';

import { modules } from 'meteor/wmd-extensions';

import context from './lib/context';
import AppRoot from '../components/AppRoot';
import './routes';
import './style';

if (process.env.NODE_ENV === 'development')
  window.Perf = require('react-addons-perf');

// load modules from extensions that called ext.addModule()
modules.forEach(app => app.load(context));

var reactRoot;
Meteor.startup(() => {
  reactRoot = document.createElement('div');
  reactRoot.id = 'react-root';
  document.body.appendChild(reactRoot);
  render(AppRoot, reactRoot);
});

if (module.hot) {
  module.hot.accept('../components/AppRoot', function() {
    const nextAppRoot = require('../components/AppRoot').default;
    render(nextAppRoot, reactRoot);
  });
}