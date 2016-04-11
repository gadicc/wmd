import React from 'react';
import { Button } from 'react-toolbox/lib/button';

const AddServiceForm = () => (
  <form>
    <p>
      Hostnames (updated on blur, no restart required): <br />
      <textarea name="hostnames">
      </textarea>
    </p>
    <p>
      <span style={{marginRight: '15px'}}>Source:</span>
      <Button label='CLI Deploy' raised />
      <Button label='GitHub' />
    </p>
      {/*
      <input type="text" name='moo' {...fields.moo} />
    */}
    <Button type="submit" label="Submit" raised primary />
  </form>

);

export default AddServiceForm;