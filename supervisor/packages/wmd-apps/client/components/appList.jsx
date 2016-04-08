import React, { Component } from 'react';
import { Card, CardMedia, CardTitle, CardText, CardActions } from 'react-toolbox/lib/card';
import { Button } from 'react-toolbox/lib/button';
import Input from 'react-toolbox/lib/input';
import Dialog from 'react-toolbox/lib/dialog';

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

const AppList = ({apps, handleSubmit, actions, fields}) => (
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

export default AppList;
