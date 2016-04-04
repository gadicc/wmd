Package.describe({
  name: 'wmd-services',
  version: '0.0.1',
  summary: '',
  git: '',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.3-beta.12');
  api.use('ecmascript');
  api.use('wmd-extensions');
  // api.use('reactive-var');
  api.mainModule('client/index.js', 'client');
  api.addFiles('client/components/servicesList.css', 'client');
  //api.mainModule('server/index.js', 'server');
});

/*
Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('wmd-iaas');
  api.mainModule('wmd-iaas-tests.js');
});
*/