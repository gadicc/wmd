import React from 'react';
import Redbox from 'redbox-react';
import { Provider } from 'react-redux'
import { AppContainer } from 'react-hot-loader';

import { Store } from '/imports/client/lib/context';
import MainLayout from './MainLayout';

const StoreProvider = (props) => (
  <Provider store={Store}>
    <MainLayout {...props} />
  </Provider>
);

const consoleErrorReporter = ({error}) => {
  console.error(error);
  return <Redbox error={error} />;
};

consoleErrorReporter.propTypes = {
  error: React.PropTypes.error
};

const AppRoot = (
  <AppContainer errorReporter={consoleErrorReporter} component={StoreProvider} />
);

export default AppRoot;