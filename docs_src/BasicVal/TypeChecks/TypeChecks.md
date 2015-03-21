BasicVal's built-in type checks should be used to check that a value is of a particular type.

The first parameter is usually a boolean indicating whether the field is required or not. The default is ```true```. 

Whether or not the field is required can also be specified in the ```options``` parameter, which is an object. Such an ```options``` object would look like:

```{required: true}```.

Some type checks such as ```number``` and ```integer``` can optionally be used to parse the value into the expected type if it is valid. This option is set via a flag:

```{parse: true}```

If a value is parsed, it is automatically emitted, meaning that all subsequent checks (and retrieval using .get), will receive the parsed value.