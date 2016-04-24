import { DefaultRouter } from './lib/context.js';

const origRoute = DefaultRouter.route;
DefaultRouter.route = function(path, options) {
  if (typeof options === 'string')
    options = { name: options };
  if (!options.action)
    options.action = function() {
    }
  origRoute.call(this, path, options);
};

DefaultRouter.route('/', {
  action() {
    DefaultRouter.go('/apps');
  }
});

DefaultRouter.route('/:tab', 'main');
DefaultRouter.route('/:tab/:_id', 'main');
DefaultRouter.route('/:tab/:_id/:action', 'main');
