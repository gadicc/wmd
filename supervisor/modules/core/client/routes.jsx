import React from 'react';
import {mount} from 'react-mounter';

import MainLayout from './containers/main_layout.jsx';
/*
import PostList from './containers/postlist';
import Post from './containers/post';
import NewPost from './containers/newpost';
*/

export default function (injectDeps, {DefaultRouter}) {
  const MainLayoutCtx = injectDeps(MainLayout);

  const origRoute = DefaultRouter.route;
  DefaultRouter.route = function(path, options) {
    if (typeof options === 'string')
      options = { name: options };
    if (!options.action)
      options.action = function() {
        mount(MainLayoutCtx)
      }
    origRoute.call(this, path, options);
  };


  DefaultRouter.route('/', {
    action() {
      FlowRouter.go('/apps');
    }
  });

  DefaultRouter.route('/:tab', 'main');
}