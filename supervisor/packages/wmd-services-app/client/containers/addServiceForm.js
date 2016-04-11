import AddServiceForm from '../components/addServiceForm';
import {reduxForm} from 'redux-form';
import React from 'react';

const AddServiceFormContainer = (props) => {
  const AddServiceReduxForm = reduxForm({
    form: `appsEditAddServices_${props.appId}_meteor`,
    fields: [ 'moo' ]
  })(AddServiceForm)

  return ( <AddServiceReduxForm {...props} /> );
};

AddServiceFormContainer.propTypes = {
  appId: React.PropTypes.string
};

export default AddServiceFormContainer;