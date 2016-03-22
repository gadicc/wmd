// request-promies doesn't so streams so well
import request from 'request';
import promisify from './promisify';
import fs from 'fs';

async function upload(build, url) {
  return new Promise((resolve, reject) => {
    fs.createReadStream(build)
      .pipe(request.put(url, (err, response, body) => {
        if (err)
          reject(err);
        resolve({ response, body });
      }));
  });
}

export default upload;
