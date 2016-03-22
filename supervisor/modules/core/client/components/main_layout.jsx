import React from 'react';
import { Tabs, Tab } from './tabs';
import { tabs } from 'meteor/wmd-extensions';
import Blaze from 'meteor/gadicc:blaze-react-component';

const Layout = ({tab, actions}) => {
  const onTabClick = actions().mainLayout.onTabClick;
  return (
    <div>
      <div style={{ float: 'right' }}>
        <Blaze template="loginButtons" align="right" />
      </div>
      <div>
        <Tabs tab={tab} onTabClick={onTabClick}>
         { tabs.map(({key, name, content}) => ( <Tab key={key} name={name}>{content}</Tab> )) }
        </Tabs>    
      </div>
    </div>
  );
};

export default Layout;
