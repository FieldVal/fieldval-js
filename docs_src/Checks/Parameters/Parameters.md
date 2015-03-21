A check function must take a value and return an error. To make reusable checks that can be configured for each use using parameters, you must create a wrapper for the check.

The example provided is a function that performs the same action as BasicVal.minimum.

```check``` is now a function that will return an error if the value is less than ```14```. This is because minimum is a wrapper that creates a function with access to the configuration parameters (```14``` as ```min_val``` in this case).

[Options](/docs/fieldval/Options) are additional parameters. If ```options``` is set then the check becomes a property of the ```options``` object. The FieldVal library can use both an object that contains a ```check``` property and also a function directly.