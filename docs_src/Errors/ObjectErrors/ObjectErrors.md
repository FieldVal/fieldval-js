FieldVal's error structure is designed to match the input structure on a per-key level. This is achieved by attaching each error to its appropriate key and building a hierarchical structure that can be easily navigated both visually and programmatically.

There are three types of errors:

* ```invalid```
	
	These fields were provided, but there was something wrong with the values.
	
	* ```my_integer``` isn't an integer - it's a string
	* ```my_string``` isn't a string - it's a integer

* ```missing```
	
	These fields were indicated as required during validation, but they aren't in the data.

	* ```my_array``` wasn't present

* ```unrecognized```
	
	When validation ended, these fields hadn't been looked for, but they were sent.

	* ```curveball``` wasn't a valid field to send