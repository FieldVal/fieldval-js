Introduction to FieldVal
========


Checks
========
FieldVal validation is based on chaining checks to validate a value. 

A "check" is a function that takes a value and returns an error if the value was invalid, otherwise it returns nothing (undefined).

[bval](https://github.com/FieldVal/fieldval-basicval-js/) is a collection of basic checks such as types and numeric limits.

The intended use case of FieldVal is validating objects containing keys. FieldVal allows the chaining of checks in the .get() function to validate the requested key.

The .get() function will return the value for the key if no errors were found, otherwise it will add errors to the validator, so that they can be output later.

E.g.

```javascript
var my_integer = validator.get("my_integer", bval.integer(true), bval.minimum(50), bval.maximum(100));
```

Given that ```validator``` is an instance of ```FieldVal```, this line will check that the "my_integer" key is first an integer, then if it has a minimum of 50 and finally if it has a maximum of 100.

The boolean parameter to bval.integer() specifies whether or not the field is required. If a field is not required, no error will be thrown if it is not found, but if it is present then it will be processed as normal (subsequent errors aren't ignored just because a field is not required).


Custom Checks
========
Each check is a function that takes a value and an optional emit function.

```javascript
var my_custom_check = function(value,emit){
	var checks = [
		bval.string(true),//Must be a string
		bval.prefix("ABC"),//Must start with "ABC"
		bval.length(6)//Must be 6 characters in length
	]
	var error = FieldVal.use_checks(value,checks);
	if(error)return error;

	var suffix = value.substring(3);
	var number;
	var error = bval.integer(true, {parse:true}).check(suffix,function(int_value){
		number = int_value;
	}); if(error)return error;
	var error = bval.minimum(0)(number); if(error) return error;

	emit(number);//Output the numeric value of the suffix of the string
}
```

The my_custom_check function above checks the following:
* The value is a string
* The string has the prefix "ABC"
* The string is 6 characters long
* The suffix is an integer
* The integer is at least 0

Then the check uses the emit callback to output the integer suffix as the new value. This does not modify the original value, but allows the subsequent checks to operate on this new value.

Anything returned by a check is considered to be an error and is inserted into the validator using validator.invalid();