Abstraction of github stuff WIP

## Design Goals

* Provide Meteor synchronous-style functions
* Above functions deal ONLY with local collection (but send cache refresh request)
* Local collection caches data, with etags.
* Can refresh cache on login, etc.

github.npmAsync = original funcs
github.npmSync = original funcs, wrapped
