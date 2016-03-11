import React from 'react';

export class Tabs extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      activeTabId: props.activeTabId || props.children[0].props.id
    };

  }

  setActiveTabId(tabId) {
    this.setState({ activeTabId: tabId });
  }

  render() {
    var tabHeaders = [];
    var tabContent;

    this.props.children.forEach((tab) => {
      var className = 'tabHeader';
      var onClick = this.setActiveTabId.bind(this, tab.props.id);

      if (tab.props.id === this.state.activeTabId) {
        tabContent = tab.props.children;
        className += " active";
      }

      tabHeaders.push(
        <div key={tab.props.id} className={className} onClick={onClick}>{tab.props.name}</div>
      );

    });

    return (
      <div className="tabPane">
        <div className="tabHeaders">{tabHeaders}</div>
        <div className="tabContent">{tabContent}</div>
      </div>
    );
  }

}

export class Tab extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    console.log(this);
    var { id, name } = this.props;

    return (
      <div class="tab" key={id} name={name}>XX</div>
    );
  }

}
