import React, { Component } from 'react';
import { reset } from 'redux-form'

import { composeWithTracker } from 'mantra-core';
import { reduxForm } from 'redux-form'
//import Dialog from 'react-toolbox/lib/dialog';

import { Card, CardTitle, CardText, CardActions } from 'react-toolbox/lib/card';
import { Button } from 'react-toolbox/lib/button';
import Input from 'react-toolbox/lib/input';
import Dialog from 'react-toolbox/lib/dialog';

import { ext } from '../index.js';

import { Apps } from '../context.js';

/* --------------------------- presentational ----------------------------- */

const AppListUI = ({apps, handleSubmit, actions, fields}) => (
  <div className="appList">

    <Card style={cardStyle}>
      <CardTitle title="Create New"/>

      <CardText>
        <div style={{marginBottom: '10px'}}>
          Create a new project here, or alternatively, via meteor-deploy.
        </div>
        <form onSubmit={handleSubmit(actions.submit2)}>
          <Input type='text' label='App Name' {...fields.name} />
          <CardActions>
            <Button label="Go" />
          </CardActions>
        </form>
      </CardText>
    </Card>

    { apps.map((app) => (
      <Card key={app._id} style={cardStyle}>
        <CardTitle title={app.name} />
        <CardActions>
          <Button label="Info" onClick={actions.info.bind(this, app)} />
          <Button label="Edit" onClick={actions.edit.bind(this, app)} />
          <RemoveButton app={app} remove={actions.remove} />
        </CardActions>
      </Card>
    )) }

  </div>
);


var cardStyle = { width: '250px', height: '250px', display: 'inline-block', marginRight: '10px' };

class RemoveButton extends Component {

  state = {
    active: false
  };

  toggle = () => {
    this.setState({active: !this.state.active});
  }

  actions = [
    { label: 'Cancel', onClick: this.toggle },
    { label: 'Remove', onClick: () => { this.toggle(); this.props.remove(this.props.app); } }
  ];

  render() {
    return (
      <div>
        <Button label="Remove" onClick={this.toggle} />
        <Dialog actions={this.actions} active={this.state.active} title={`Remove "${this.props.app.name}" ?`}>
          <div>
            <b>{this.props.app.name}</b>
            <span> will be permanently removed</span>
            <p>(TODO, disallow if any active stuff running, or if services aren't removed first?)</p>
          </div>
        </Dialog>
      </div>
    );
  }
} 

/* ------------------------------ actions --------------------------------- */

const actions = {

  submit2({name}) {
    const { Store, FlowRouter } = ext.appContext();
    const appId = Apps.insert({name});
    Store.dispatch(reset('app_new'));
    FlowRouter.go(`/apps/${appId}/edit`);
  },

  remove(app) {
    Apps.remove(app._id);
  },

  edit(app) {
    const { FlowRouter } = ext.appContext();
    FlowRouter.go(`/apps/${app._id}/edit`);
  },

  info(app) {
    const { FlowRouter } = ext.appContext();
    FlowRouter.go(`/apps/${app._id}`);    
  }

};

/* ------------------------------ reducers -------------------------------- */

const reducers = {

};

/* ----------------------------- container -------------------------------- */

function composer(props, onData) {
  const apps = Apps.find().fetch();
  onData(null, {apps, actions});
}

const AppListData = reduxForm({
  form: 'app_new',
  fields: [ 'name' ]
})(composeWithTracker(composer)(AppListUI));

/* ------------------------------ exports --------------------------------- */

export { AppListUI, actions, reducers };
export default AppListData;
