if (typeof Package === 'undefined')
  return;

Package.describe({
  name: 'wmd-servers',
  version: '0.0.1',
  // Brief, one-line summary of the package.
  summary: '',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.3-beta.12');
  api.use('ecmascript');
  api.use('wmd-extensions');
  api.mainModule('client/index.js', 'client');
  api.addFiles('client/components/serverList.css', 'client');
  //api.mainModule('server/index.js', 'server');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('wmd-iaas');
  api.mainModule('wmd-iaas-tests.js');
});
