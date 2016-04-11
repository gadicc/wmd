import ee, { ext } from '../lib/index.js';

import ServicesList, { registerServiceType, serviceTypes } from './containers/servicesList.jsx';

ext.addTab('services', "Services", ServicesList);

ee.prototype.registerServiceType = registerServiceType;

export { ext, serviceTypes };
export default ee;
