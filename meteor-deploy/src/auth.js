import DDPClient from 'ddp';
import login from 'ddp-login';
import promisify from './promisify';

const loginAsync = promisify(login);

async function wmdLogin(session) {
  const ddpClient = new DDPClient({
    host : "localhost",
    port : 7000,
    ssl  : false,
    autoReconnect : false,
    autoReconnectTimer : 500,
    maintainCollections : true,
    ddpVersion : '1',
    useSockJs: true
  });

  ddpClient.connectAsync = promisify(ddpClient.connect);
  await ddpClient.connectAsync();

  var userInfo;
  if (session && new Date() < new Date(session.tokenExpires)) {

    userInfo = await loginAsync.loginWithToken(ddpClient, session.token);

  }

  if (!userInfo) {

    userInfo = await loginAsync(ddpClient, {
      method: 'account', account: null, pass: null, retry: 5, plaintext: false
    });  

  }

  ddpClient.close();

  return userInfo;
}

export default wmdLogin;
