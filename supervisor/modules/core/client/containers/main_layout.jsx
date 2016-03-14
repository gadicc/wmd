import {useDeps, compose, composeAll} from 'mantra-core';
import MainLayout from '../components/main_layout.jsx';

const defaultTab = 'apps';

const composer = ({context}, onData) => {
  const { Store } = context();

  var route = Store.getState().route;
  onData(null, { tab: (route.params && route.params.tab) || defaultTab });

  return Store.subscribe(() => {
    var route = Store.getState().route;
    onData(null, { tab: (route.params && route.params.tab) || defaultTab });
  });
}

export default composeAll(
  compose(composer),
  useDeps()
)(MainLayout);
