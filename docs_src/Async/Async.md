Requiring an asynchronous action to validate a parameter is a common validation scenario.

To use asynchronous checks, call ```.get_async(key_name, check_array, [callback])``` on the FieldVal instance.

```check_array``` is an array of checks and ```callback``` is a function to call after validation has finished.

You can use synchronous ```.get``` and asynchronous ```.get_async``` within the same FieldVal instance.

Synchronous checks work with ```.get_async```, but asynchronous checks will not work with ```.get```.

The ```.end``` function of the FieldVal instance takes a callback that will be called with the error if one is present.

```.end``` waits for all fields to finish validating before calling the callback.