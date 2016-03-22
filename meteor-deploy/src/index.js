import 'babel-polyfill';
import fs from 'fs';
import path from 'path';

import promisify from './promisify';
import login from './auth';
import upload from './upload';

const fsAsync = promisify(fs);

const rcFilePath = path.join(process.env.HOME, '.config', 'wmd-meteor-deploy.json');
var rcFile = { deployServer: '', sessions: {} };

var server = 'localhost:7000';

var err = (async function main() {
  var result;

  // fs.exists is deprecated and the alternatives rely on throwing an error
  var rcFileExists = true;
  try {
    await fsAsync.access(rcFilePath);
  } catch (err) {
    if (err.code === 'ENOENT')
      rcFileExists = false;
    else
      throw err;
  }

  if (rcFileExists) {
    result = await fsAsync.readFile(rcFilePath);
    if (result)
      rcFile = JSON.parse(result);
  }

  // login if we don't have a valid session
  var session = rcFile.sessions[server];
  if (!session || new Date() < new Date(session.tokenExpires)) {
    session = rcFile.sessions[server] = await login(rcFile.sessions[server]);
    await fs.writeFile(rcFilePath, JSON.stringify(rcFile, null, 2));
  }

  //var file = '/home/dragon/alerts.txt';
  var file = '/home/dragon/www/tmp/basic/out/basic.tar.gz';
  
  upload(file, `http://localhost:7000/meteorDeploy/${session.token}/www.gadi.cc`);

})().catch((err) => {
  setTimeout(() => { throw err; });
});
