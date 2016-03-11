Instanceables (nginx, app, database)
* Has global state: starting, started, stopped + actions
* Has instance state per each instance + actions
* Must have clear transition on what to do from one state to another

Process
* Can be run locally or via remotely via wmd-agent
* Provide an extra FD to communicate with process / be passed to task
* Optionally log or stream stdout and stderr.
* Log must be integratable as part of a task log
* Can be synchronous (via fibers) or asynchronous (with callbacks)
* Run a build process, docker container, nginx, meteor app, mongo
* Can be used for ongoing process

Packages
* Total separataion.  github package, wmd-github package, etc.
* wmd-* via gadicohen:extensions

Tasks
* Task is an array of steps.
* Each step is an object which defines the step
* A step can also be an array of objects, which will be run in parallel
- or a function which will be run when the step is reached to generate object or array of objects
* Step ultimately includes a function which can be sync (fibers) or async (done callback)
* Task can be an ongoing task which runs indefinitely (status: "ongoing")
* Show all tasks, and related info (where they're running, percent complete, etc)
* Task gets it's own log file, each step can optionally have it's own logfile

App update task
* Update code
* Launch new instances
* Wait for start -> running
* Update proxy
* Down old servers

Agents
* Report server CPU
* Run processes, stream logs
* Sync files by sha1 (nginx.conf, scripts)
* Restore state across reload

