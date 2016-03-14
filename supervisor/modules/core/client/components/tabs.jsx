import React from 'react';

export class Tabs extends React.Component {

  constructor(props) {
    super(props);

    if (!props.tab)
      this.state = {
        activeTabKey: props.activeTabKey || props.children[0].key || props.children[0].props.key
      };
  }

  setActiveTabKey(tabKey) {
    this.setState({ activeTabKey: tabKey });
  }

  render() {
    var tabHeaders = [];
    var tabContent;

    this.props.children.forEach((tab) => {
      const tabKey = tab.key || tab.props.key;
      const currentTabKey = this.props.tab || tabKey === this.state.activeTabKey;
      const onClick = this.props.onTabClick
        ? this.props.onTabClick.bind(null, tabKey)
        : this.setActiveTabKey.bind(this, tabKey);

      var className = 'tabHeader';
      if (tabKey === currentTabKey) {
        tabContent = tab.props.children;
        className += " active";
      }

      tabHeaders.push(
        <div key={tabKey} className={className} onClick={onClick}>{tab.props.name}</div>
      );

    });

    return (
      <div className="tabPane">
        <div className="tabHeaders">{tabHeaders}</div>
        <div className="tabContent">{tabContent()}</div>
      </div>
    );
  }

}

export class Tab extends React.Component {}
