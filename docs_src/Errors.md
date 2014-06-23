Errors
========

FieldVal libraries use a common error structure to make it easy to transport errors straight from a validation check, all the way to an end user.

An error has the following basic structure:
```json
{
	"error_message": "A message describing the error",
	"error": 1017//A number associated with this particular error
}
```

Object Errors
========
When validating the object:
```json
{
	"my_integer": "Not an integer",
	"my_string": 23,
	"curveball": "Not expected!"
}
```

The following error might be created:

```json
{
	"error_message": "One or more errors.",
	"error": 0,
	"invalid": {
		"my_string": {
			"error_message": "Incorrect field type. Expected string.",
			"error": 2,
			"expected": "string",
			"received": "number"
		},
		"my_integer": {
			"error_message": "Incorrect field type. Expected integer.",
			"error": 2,
			"expected": "integer",
			"received": "string"
		}
	},
	"missing": {
		"my_array": {
			"error_message": "Field missing.",
			"error": 1
		}
	},
	"unrecognized": {
		"curveball": {
			"error_message": "Unrecognized field.",
			"error": 3
		}
	}
}
```

This error outlines 3 categories of issues with the provided data -

* ```invalid```
	
	These fields were provided, but there was something wrong with the values.
	
	* ```my_integer``` isn't an integer - it's a string
	* ```my_string``` isn't a string - it's a integer

* ```missing```
	
	These fields were indicated as required during validation, but they aren't in the data.

	* ```my_array```

* ```unrecognized```
	
	When validation ended, these fields hadn't been looked for, but they were sent.

	* ```curveball``` wasn't a valid field to send


One field, multiple errors
========

FieldVal's default behaviour is to stop checking a field after the first error is found, but sometimes it's useful to report multiple errors for the same value. In this case, errors are structured as follows:

```json
{
	"error": 4,
	"error_message": "Multiple errors.",
	"errors": [
		{
			"error": 106,
			"error_message": "Value does not have prefix: ABC"
		},
		{
			"error": 110,
			"error_message": "Value does not have suffix: XYZ"
		}
	]
}
```