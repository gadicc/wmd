import React, { Component } from 'react';

import Dialog from 'react-toolbox/lib/dialog';

import Card from 'material-ui/lib/card/card';
import CardActions from 'material-ui/lib/card/card-actions';
import CardTitle from 'material-ui/lib/card/card-title';
import CardText from 'material-ui/lib/card/card-text';

import Button from 'material-ui/lib/flat-button';
import TextField from 'material-ui/lib/text-field';

var cardStyle = { width: '250px', height: '250px', display: 'inline-block', marginRight: '10px', verticalAlign: 'top' };

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

const AppList = ({apps, handleSubmit, actions, fields}) => (
  <div className="appList">

    <Card style={cardStyle}>
      <CardTitle title="Create New"/>

      <CardText>
        <div style={{marginBottom: '10px'}}>
          Create a new project here, or alternatively, via meteor-deploy.
        </div>
        <form onSubmit={handleSubmit(actions.submit2)}>
          <TextField floatingLabelText='App Name' fullWidth={true} {...fields.name} />
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
          <Button label="Edit" onClick={actions.edit.bind(this, app)} />
          <RemoveButton app={app} remove={actions.remove} />
        </CardActions>
      </Card>
    )) }

  </div>
);

export default AppList;
