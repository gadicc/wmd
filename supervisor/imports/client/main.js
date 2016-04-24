import 'react-hot-loader/patch';
import { render } from 'react-dom';

import { Meteor } from 'meteor/meteor';

import { modules } from 'meteor/wmd-extensions';

import context from './lib/context';
import AppRoot from '../components/AppRoot.js';
import './routes';

if (process.env.NODE_ENV === 'development')
  window.Perf = require('react-addons-perf');

// load modules from extensions that called ext.addModule()
modules.forEach(app => app.load(context));

Meteor.startup(() => {
  const reactRoot = document.createElement('div');
  reactRoot.id = 'react-root';
  document.body.appendChild(reactRoot);
  render(AppRoot, reactRoot);
});