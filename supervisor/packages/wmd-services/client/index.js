import Extension from 'meteor/wmd-extensions';
import ExtensionHost from 'extensions';

import ServicesList from './containers/servicesList.jsx';

var wmd = new Extension({
  name: 'wmd-services'
});

wmd.addTab('serverices', "Services", ServicesList);
