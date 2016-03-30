import React from 'react';
//import { Tabs, Tab } from './tabs';
import { Tab, Tabs } from 'react-toolbox/lib/tabs';
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
              return (<Tab key={key} label={name}>{content}</Tab> );
            }) }
          </Tabs>    
        </div>
      </div>
    </Provider>
  );
};

export default Layout;
