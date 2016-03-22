import React, { Component } from 'react';
import { _ } from 'meteor/underscore';

class Form extends Component {
  constructor(props) {
    super(props);
    this.state = {}
  }

  onChange(name, event) {
    this.setState({ [name]: event.currentTarget.value });
  }

  onSubmit(event) {
    event.preventDefault();
    if (this.props.onSubmit)
      this.props.onSubmit(this.state, event);
  }

  render() {
    var children = this.props.children;

    if (children.length)
      children = children.map((child, i) => {
        return React.cloneElement(child, {
          key: i,
          onChange: this.onChange.bind(this, child.props.name)
        }, child.props.children)
      });
    else
      children = React.cloneElement(children, {
        onChange: this.onChange.bind(this, children.props.name)
      });

    return (
      <form onSubmit={this.onSubmit.bind(this)}>
        {children}
      </form>
    );
  }
}

const TextInput = ({name, title, onChange}) => (
  <div>
    <label>
      <span>{title}</span><br />
      <input type="text" name={name} onChange={onChange} />
    </label>
  </div>
);

const ServerList = ({servers, addServer}) => (
  <div>
    <div className="serverList">{
      servers.map((p) => (
        <div key={p._id} className="server">
          <h3>{p.hostname}</h3>
        </div>
      ))
    }</div>
    <div>
      <h3>Add a Server</h3>
      <p>
        Add an existing server by hand.  Usually this is done for you via the
        IAAS tab.  The server needs to have Docker and the appropriate
        credentials installed.
      </p>
      <Form onSubmit={addServer}>
        <TextInput name="hostname" title="Hostname" />
        <input type="submit" />
      </Form>
    </div>
  </div>
);

export default ServerList;
