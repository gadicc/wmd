import {createApp} from 'mantra-core';
import initContext from './configs/context';

// modules
import coreModule from '../modules/core/client';

// init context
const context = initContext();

// create app
const app = createApp(context);

// load modules
app.loadModule(coreModule);

app.init();