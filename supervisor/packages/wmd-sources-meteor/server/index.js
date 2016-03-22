import { WebApp } from 'meteor/webapp';
import { Accounts, AccountsServer } from 'meteor/accounts-base';
import { _ } from 'meteor/underscore';
import Extension from 'meteor/wmd-sources';
import path from 'path';
import fs from 'fs';

var resumeHandler = _.find(Accounts._loginHandlers, (h) => h.name === 'resume').handler;

var ext = new Extension({
  name: 'wmd-sources-meteor'
});

// TODO, except an md5sum too.
WebApp.connectHandlers.use(function(req, res, next) {
  if (req.method !== 'PUT' || req.url.substr(0, 14) !== '/meteorDeploy/')
    return next();

  var token, hostname, match = /\/meteorDeploy\/(.+?)\/(.+?)$/.exec(req.url);
  if (match) {
    token = match[1];
    hostname = match[2];
  }

  var user;
  const userAuth = resumeHandler({ resume: token });
  if (userAuth.userId) {
    user = Meteor.users.findOne(userAuth.userId);
  } else {
    res.writeHead(404, 'Invalid login token');
    res.end();
    return;
  }

  var outputFilename = path.join(ext.getStorageDir(), 'basic.tar.gz');
  var outputStream = fs.createWriteStream(outputFilename);

  req.on('end', () => {
    res.writeHead(200);
    res.end();
  });

  outputStream.on('error', err => {
    console.log(err);
  });

  req.pipe(outputStream);
});

WebApp.connectHandlers.use((req, res, next) => {
  if (req.url.substr(0, 13) !== '/meteorBuild/')
    return next();

  var inputFilename = path.join(ext.getStorageDir(), 'basic.tar.gz');
  var inputStream = fs.createReadStream(inputFilename);

  res.writeHead(200, {
    'Content-disposition': `attachment; filename=basic.tar.gz`,
    'Content-type': 'application/tar+gzip'
  });
  inputStream.pipe(res);

});