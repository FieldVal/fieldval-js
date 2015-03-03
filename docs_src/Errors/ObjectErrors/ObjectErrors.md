FieldVal's error structure is designed to match the input structure on a per-key level. This is achieved by attaching each error to its appropriate key and building a hierarchical structure that can be easily navigated both visually and programmatically.

There are three main keys for errors:

* ```error_message```

	This is the human-readable error message.

* ```error```
	
	This is the error code. The basic codes and their associated ```error_message``` are:

	* ```1``` "Field missing."
	* ```2``` "Incorrect field type. Expected \__\_expected\___."
	* ```3``` "Unrecognized field."
	* ```4``` "Multiple errors." - used when a single value has multiple errors.
	* ```5``` "One or more errors." - used when an object or array's fields contain errors.

* ```invalid```
	
	These fields have errors. Either they were not provided, but are required (missing), unrecognized because they were not looked for when validating or they contain an invalid value.
	
	* ```my_integer``` isn't an integer - it's a string
	* ```my_object``` contains invalid fields
	* ```my_array``` wasn't present
	* ```curveball``` wasn't recognized 