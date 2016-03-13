module.exports = function (wallaby) {
  // There is a weird error with the mui and mantra.
  // See: https://goo.gl/cLH8ib
  // Using require here seems to be the error.
  // Renaming it into `load` just fixed the issue.
  var load = require;

  return {
    files: [
//      'lib/*.js',
      '!lib/**/tests/*.js',
      'lib/**/*.js',
      'client/modules/**/components/*.jsx',
      'client/modules/**/actions/*.js',
      'client/modules/**/containers/*.js',
      'client/modules/**/libs/*.js'
    ],
    tests: [
//      'lib/tests/*.js',
      'lib/**/tests/*.js',
      'client/**/tests/*.js'
    ],
    compilers: {
       '**/*.js*': wallaby.compilers.babel({
         babel: load('babel-core'),
         presets: ['es2015', 'stage-2', 'react']
       })
    },
    env: {
      type: 'node'
    },
    testFramework: 'mocha',
    setup: function() {
      global.React = require('react');
    }
  };
};
