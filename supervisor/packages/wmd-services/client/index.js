import ee, { ext } from '../lib/index.js';

import ServicesList, { registerService, services } from './containers/servicesList.jsx';

ext.addTab('services', "Services", ServicesList);

ee.prototype.registerService = registerService;

export { ext, services };
export default ee;
