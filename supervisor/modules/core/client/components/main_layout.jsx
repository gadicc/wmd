import React from 'react';
import { Tabs, Tab } from './tabs';
import { tabs } from 'meteor/wmd-extensions';

/*
tabList.push(<Tab key="apps" name="Apps">apps</Tab>);
tabList.push(<Tab key="servers" name="Servers">servers</Tab>);
*/

const Layout = ({content = () => null }) => {
  return (
    <div>
      <Tabs>
       { tabs.map(({key, name, content}) => ( <Tab key={key} name={name}>{content}</Tab> )) }
      </Tabs>    
    </div>
  );
};

export default Layout;
