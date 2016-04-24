import React from 'react';
import { connect } from 'react-redux'

// import pure from 'recompose/pure';

//import { Tabs, Tab } from './tabs';
import { Tab, Tabs } from 'react-toolbox/lib/tabs';
import { tabs } from 'meteor/wmd-extensions';

import Blaze from 'meteor/gadicc:blaze-react-component';

// XXX shared dir importing client file, need to think about how to split context
import { FlowRouter } from '/imports/client/lib/context';
import './MainLayout.css';

/* --------------------------- presentational ----------------------------- */

var _cache = {};
function createElementCache(content) {
  if (!_cache[content])
    _cache[content] = React.createElement(content);
  return _cache[content];
}

const MainLayoutUI = ({tab}) => {
  return (
    <div>
      <div style={{ position: 'absolute', top: 0, right: 0, zIndex: 100 }}>
        <Blaze template="loginButtons" align="right" />
      </div>
      <div>
        <Tabs tab={tab} onChange={actions.onChange}>
         { tabs.map(({key, name, content}) => (
            <Tab key={key} label={name}>{createElementCache(content)}</Tab>
         )) }
        </Tabs>    
      </div>
    </div>
  );
};

MainLayoutUI.propTypes = {
  tab: React.PropTypes.string
};

/* ------------------------------ actions --------------------------------- */

const actions = {
  onChange(idx, tab) {
    FlowRouter.go(`/${tab}`);
  }
};

/* ------------------------------ reducers -------------------------------- */

const reducers = {};

/* ----------------------------- container -------------------------------- */

const defaultTab = 'apps';

const MainLayoutData = connect(({route}) => ({
  tab: route.params && route.params.tab || defaultTab
}))(MainLayoutUI);

/* ------------------------------ exports --------------------------------- */

export { MainLayoutData, actions, reducers };
export default MainLayoutData;
