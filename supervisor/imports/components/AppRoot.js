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

const throwingErrorReporter = ({error}) => {
  setTimeout(() => { throw error; });
  return <Redbox error={error} />;
};

throwingErrorReporter.propTypes = {
  error: React.PropTypes.error
};

const AppRoot = (
  <AppContainer errorReporter={throwingErrorReporter} component={StoreProvider} />
);

export default AppRoot;