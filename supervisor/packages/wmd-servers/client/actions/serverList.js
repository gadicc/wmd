import { Servers } from '../configs/context.js';

const actions = {

  addServer(data) {
    Servers.insert(data);
  }


};

export default actions;