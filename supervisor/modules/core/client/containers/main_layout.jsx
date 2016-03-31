import {useDeps, compose, composeAll} from 'mantra-core';
import MainLayout from '../components/main_layout.jsx';

const defaultTab = 'apps';

const composer = ({context}, onData) => {
  const { Store } = context();

  var route = Store.getState().route;
  onData(null, { value: (route.params && route.params.value) || defaultTab });

  return Store.subscribe(() => {
    var route = Store.getState().route;
    onData(null, { value: (route.params && route.params.value) || defaultTab });
  });
}

export default composeAll(
  compose(composer),
  useDeps()
)(MainLayout);
