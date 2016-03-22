import ee, { ext } from '../lib/index.js';
import SourcesList, { addSource } from './containers/sourcesList.jsx';

ext.addTab('sources', "Sources", SourcesList);

ee.prototype.addSource = addSource;

export { ext };
export default ee;