import React from 'react';
import { Tabs, Tab } from './tabs';

const Layout = ({content = () => null }) => (
  <div>
    <Tabs>
       <Tab id="apps" name="Apps">
       </Tab>
       <Tab id="servers" name="Servers">servers</Tab>
       <Tab id="iaas" name="IAAS">IAAS</Tab>
    </Tabs>    
  </div>
);

export default Layout;