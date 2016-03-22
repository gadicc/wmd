import Docker from 'dockerode';

var docker = new Docker({socketPath: '/var/run/docker.sock'});

/*
docker.pull('meteorhacks/meteord:onbuild', (err, stream) => {
  if (err)
    console.log(err);
  stream.pipe(process.stdout);
  stream.pipe(process.stderr);
});
*/

/*
docker.listContainers(function (err, containers) {
  containers.forEach(function (containerInfo) {
    console.log(5, containerInfo);
    //docker.getContainer(containerInfo.Id).stop(cb);
  });
});


docker.createContainer(
  {
    Image: 'meteorhacks/meteord:base',
    name: 'm5',
    Env: [
      'ROOT_URL=http://localhost:4500/',
      'BUNDLE_URL=http://192.168.1.50:7000/meteorBuild/',
      'MONGO_URL=mongodb://192.168.1.50:7001/meteor'
    ],
    HostConfig: {
      "PortBindings": { "80/tcp": [{ "HostPort": "4500" }] }
    }
  },
  (err, container) => {
    if (err)
      console.log(err); 

    container.attach({stream: true, stdout: true, stderr: true}, function (err, stream) {
      stream.pipe(process.stdout);
      stream.pipe(process.stderr);
    });

    container.start(function (err, data) {
      if (err)
        console.log('starterr', err);
      console.log('start', data);
    });

  }
);
*/

/*
var container = docker.getContainer('25fe48477b77db2f683a109338d0fb7c7d1094de95635611e78c6b6228917521');

container.attach({stream: true, stdout: true, stderr: true}, function (err, stream) {
  stream.pipe(process.stdout);
  stream.pipe(process.stderr);
});

container.start(function (err, data) {
  if (err)
    console.log(err);
  console.log(data);
});
*/