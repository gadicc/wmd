import 'babel-polyfill';
import promisify from './promisify';
import login from './auth';
import fs from 'fs';
import path from 'path';

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
})().catch((err) => {
  setTimeout(() => { throw err; });
});
