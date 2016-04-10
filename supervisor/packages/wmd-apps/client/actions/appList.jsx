import { Apps } from '../configs/context.js';
import { reset } from 'redux-form'
import ext from '../index.js';

export default {

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

}
