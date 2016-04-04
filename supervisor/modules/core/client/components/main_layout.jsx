import React from 'react';
//import { Tabs, Tab } from './tabs';
import { Tab, Tabs } from 'react-toolbox/lib/tabs';
import { tabs } from 'meteor/wmd-extensions';
import Blaze from 'meteor/gadicc:blaze-react-component';
import { Provider } from 'react-redux'
import pure from 'recompose/pure';

const StoreProvider = pure((props) => {
  const { Store } = props.context();
  return (
    <Provider store={Store}>
      <MainLayout {...props} />
    </Provider>
  );
});

var _cache = {};
function fromCache(content) {
  if (!_cache[content])
    _cache[content] = React.createElement(content);
  return _cache[content];
}

const MainLayout = pure(({tab, actions}) => {
  const onChange = actions().mainLayout.onChange;
  return (
    <div>
      <div style={{ float: 'right' }}>
        <Blaze template="loginButtons" align="right" />
      </div>
      <div>
        <Tabs tab={tab} onChange={onChange}>
         { tabs.map(({key, name, content}) => (
            <Tab key={key} label={name}>{fromCache(content)}</Tab>
         )) }
        </Tabs>    
      </div>
    </div>
  );
});

export default StoreProvider;
