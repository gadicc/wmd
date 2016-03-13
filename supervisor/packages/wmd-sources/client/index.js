import Extension from 'meteor/wmd-extensions';
import ExtensionHost from 'extensions';

import SourcesList from './containers/sourcesList.jsx';

var wmd = new Extension({
  name: 'wmd-sources'
});

wmd.addTab('sources', "Sources", SourcesList);
