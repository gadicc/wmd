import React from 'react';
import { Button } from 'react-toolbox/lib/button';

const noop = (event) => { event.preventDefault(); };

const AddServiceForm = (fields) => (
  <div>
    <p>
      <span style={{marginRight: '15px'}}>Source:</span>

      <label>
        <Button label='CLI Deploy' {...fields.source} value="cli"
          onClick={noop} raised={fields.source.value === 'cli'} />
      </label>
      <label>
        <Button label='GitHub' {...fields.source} value="github"
          onClick={noop} raised={fields.source.value === 'github'} />
      </label>

    </p>
  </div>
);

const AddServiceFormFields = [
  'source'
];

const AddServiceFormInitialValues = {
  source: 'cli'
};

export { AddServiceFormFields, AddServiceFormInitialValues };

export default AddServiceForm;