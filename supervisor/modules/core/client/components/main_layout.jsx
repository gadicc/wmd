import React from 'react';
import { Tabs, Tab } from './tabs';
import { tabs } from 'meteor/wmd-extensions';

const Layout = ({tab, actions}) => {
  const onTabClick = actions().mainLayout.onTabClick;
  return (
    <div>
      <Tabs tab={tab} onTabClick={onTabClick}>
       { tabs.map(({key, name, content}) => ( <Tab key={key} name={name}>{content}</Tab> )) }
      </Tabs>    
    </div>
  );
};

export default Layout;
