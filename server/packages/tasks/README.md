## meteor-tasks

## Design Goals

* Tasks are written in a synchronous Meteor Style manner
* Meteor can be restarted in the middle of a task and still resume
* Maintain a collection of all task info which can be used reactively

## Examples

```js
// Single task
Tasks.define('createServer', {},
	{
		desc: 'Creating new server'
		func: function(context) { .. }
	}
);

// Array of tasks (can use previously defined tasks)
Tasks.define('newServer', {}, [
	{
		desc: 'Provisioning resources'
		func: function(context) {
			return { resourceId: 1 };
		}
	},
	'newServer',	// TODO
	{
		desc: 'Setup server',
		func: function(context, prevData) {
			// the two approaches below serve an identical purpose
			// and allows the step to be resumed in the "middle".
			// A step will always be called with data from previously
			// completed step.

			if (!this.installedId) {
				this.installedId = installScript(prevData.resourceId);
				this.resume('installedId');
			}

			this.resume('installedId', function() {
				return installScript(prevData.resourceId);
			});

		}
	}
]);
```
