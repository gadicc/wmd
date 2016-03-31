import React from 'react';

//import { Tabs, Tab } from './tabs';
//import { Tab, Tabs } from 'react-toolbox/lib/tabs';
import Tabs from 'material-ui/lib/tabs/tabs';
import Tab from 'material-ui/lib/tabs/tab';

import { tabs } from 'meteor/wmd-extensions';
import Blaze from 'meteor/gadicc:blaze-react-component';
import { Provider } from 'react-redux'

const Layout = ({tab, actions, context}) => {
  const { Store } = context();
  const onChange = actions().mainLayout.onChange;
  return (
    <Provider store={Store}>
      <div>
        <div style={{ float: 'right' }}>
          <Blaze template="loginButtons" align="right" />
        </div>
        <div>
          <Tabs tab={tab} onChange={onChange}>
           { tabs.map(({key, name, content}) => {
              content = React.createElement(content); // if...
              return (<Tab key={key} value={key} label={name}>{content}</Tab> );
            }) }
          </Tabs>    
        </div>
      </div>
    </Provider>
  );
};

export default Layout;
