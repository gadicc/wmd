import { _ } from 'meteor/underscore';
import React, { PropTypes } from 'react';
import { reduxForm } from 'redux-form';

import { ext } from '..';

import { Button } from 'react-toolbox/lib/button';

/* --------------------------- presentational ----------------------------- */

const AddServiceFormUI = ({appId, fields, ServiceForm, serviceId, submitting, handleSubmit, actions, pristine, updating}) => (
  <form onSubmit={handleSubmit(actions.submit.bind(null, appId, serviceId, updating))}>
    <p>
      Hostnames: <br />
      <textarea cols="50" rows="3" name="hostnames" {...fields.hostnames} >
      </textarea>
    </p>

    <ServiceForm {...fields[serviceId]} />

    <br />
    <Button type="submit" label={updating ? "Save Changes" : "Add Service"}
      disabled={submitting||pristine} raised primary />
  </form>

);

AddServiceFormUI.propTypes = {
  appId: PropTypes.string.isRequired,
  fields: PropTypes.object.isRequired,
  ServiceForm: PropTypes.any.isRequired,
  serviceId: PropTypes.string.isRequired,
  actions: PropTypes.object.isRequired,
  submitting: PropTypes.bool.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  updating: PropTypes.bool,
  pristine: PropTypes.bool
};

/* ------------------------------ actions --------------------------------- */

const actions = {
  submit(appId, serviceId, updating, values) {
    const { dispatch } = ext.appContext().Store;
    const Apps = ext.Apps;

    values.serviceType = 'app';
    values.service = serviceId;

    if (updating) {

      let app = Apps.findOne(appId);
      let services = _.reject(app.services, s => s.service === serviceId);
      services.push(values);

      Apps.update(appId, {
        $set: { services: services }
      });

      // Not permitted. Untrusted code may only update documents by ID.
      /*
      ext.Apps.update(
        {_id: appId, 'services.service': serviceId }, {
          $set: {
            'services.$': values
          }
        }
      );
      */

    } else {

      Apps.update(appId, {
        $push: {
          services: values
        }
      });

      dispatch({
        type: 'APPS_EDIT_ADDSERVICE_REMOVE',
        appId: appId,
        serviceId: serviceId
      });

    }
  }
};

/* ----------------------------- container -------------------------------- */

const AddServiceFormGenerator = (appId, service, serviceData) => {
  const serviceFields = service.AddServiceFormFields.map(x => `${service.id}.${x}`);

  const AddServiceReduxForm = reduxForm({
    form: `appsEditAddServices_${appId}_${service.id}_${serviceData?'update':'insert'}`,
    fields: [ 'hostnames', ...serviceFields ],
    initialValues: serviceData || {
      [service.id]: service.AddServiceFormInitialValues
    }
  })(AddServiceFormUI)

  const AddServiceContainer = () => (
    <AddServiceReduxForm
      appId={appId}
      ServiceForm={service.AddServiceForm}
      serviceId={service.id}
      actions={actions}
      updating={!!serviceData}
    />
  );

  return AddServiceContainer;
  //return service.AddServiceForm;
};


/* ------------------------------ exports --------------------------------- */

export default AddServiceFormGenerator;