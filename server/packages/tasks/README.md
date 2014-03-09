## meteor-tasks

## Design Goals

* Tasks are written in a synchronous Meteor Style manner
* Meteor can be restarted in the middle of a task and still resume
* Maintain a collection of all task info which can be used reactively
* Crash safe.  Erros are caught and logged as a task fail.

TODO

* task timeouts
* Flexibility for parallel tasks, etc.

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
	'newServer',	// TODO, include previously defined steps
	{
		desc: 'Setup server',
		func: function(context, prevData) {
			// A step will always be called with data from previously
			// completed step (even if it was halted midway and restarted)

			// Mid resume: the two approaches below serve an identical
			// purpose and allows the step to be resumed in the "middle".

			if (!this.installedId) {
				this.installedId = installScript(prevData.resourceId);
				this.resume('installedId');
				if (this.lastResume == 'installId')
					searchAndDestroyFailedRemnants();
			}

			this.resume('installedId', function() {
				return installScript(prevData.resourceId);
			}, function() {
					searchAndDestroyFailedRemnants();
			});

		}
	}
]);
```
