import { composeWithTracker } from 'mantra-core';
import { reduxForm } from 'redux-form'
//import Dialog from 'react-toolbox/lib/dialog';

import actions from '../actions/appList.jsx';
import AppList from '../components/appList.jsx';
import { Apps } from '../configs/context.js';

function composer(props, onData) {
  const apps = Apps.find().fetch();
  onData(null, {apps, actions});
}

const FormContainer = reduxForm({
  form: 'app_new',
  fields: [ 'name' ]
})(composeWithTracker(composer)(AppList));

export default FormContainer;

