import {createApp} from 'mantra-core';
import initContext from './configs/context';

import { modules } from 'meteor/wmd-extensions';

// modules
import coreModule from '../modules/core/client';

// init context
const context = initContext();

// create app
const app = createApp(context);

// load modules
app.loadModule(coreModule);

// load modules from extensions that called ext.addModule()
modules.forEach(app.loadModule.bind(app));

app.init();

