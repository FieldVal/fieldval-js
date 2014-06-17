Flags
========
Flags are used to both pass values to a check and also to indicate to a FieldVal validator how to use the check.

parse
========
The ```parse``` flag is used when checking the type of a value. If ```parse``` is set to ```true``` then an integer string such as ```"42"``` will be converted to ```42``` (an integer) if an integer was requested.

Defaults to ```false```


stop_on_error
========
The ```stop_on_error``` flag indicates to a FieldVal validator whether or not the chain of checks should be halted if this check returns an error. This flag defaults to ```true``` because in most cases such as a string being passed to an integer check proceeded by a minimum check, the desired functionality would be to return a single error stating that the value was not an integer, rather than both the integer error and also an error stating that the value was below the specified limit.

It can be useful to set ```stop_on_error``` to ```false``` if two checks are independent, e.g. having both a specific prefix and suffix. It would be best to return both errors rather than only inform the user that the suffix was invalid once they have corrected the prefix.