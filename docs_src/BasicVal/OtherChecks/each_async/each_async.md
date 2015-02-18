```BasicVal.each_async(on_each, [flags])```

Iterates through the provided array and calls the ```on_each``` function on each array's value. The ```on_each``` function for ```each_async``` uses a callback to provide its response.

```on_each(value, index, emit, done)```

The provided function should call ```done``` with a FieldVal [error](/docs/fieldval/Errors) or with no arguments if there are no errors.