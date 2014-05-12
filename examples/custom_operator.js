var Validator = require('../lib/fieldval');
var bval = Validator.BasicVal;

console.log('=============\n\
This example shows custom operator usage of FieldVal.js\n\
=============');

// The data to be validated (my_data) contains 3 keys.
var my_data = {
    a_custom_string: 'ABC123',
    a_custom_string2: 'ABC124',
}
console.log('\nmy_data:');
console.log(JSON.stringify(my_data, null, 2));


// Create a new FieldVal Validator for my_data
var validator = new Validator(my_data);


var my_custom_validator = function(val,emit){
	var error = bval.required(true)(val); if(error)return error;
	var error = bval.is_type("string")(val); if(error)return error;
	var error = bval.min_length(6)(val); if(error)return error;

	if(val.substring(0,3)!=="ABC"){
		return {
			error: 1000,
			error_message: "The string must start with \"ABC\""
		}
	}
	emit(parseInt(val.substring(3)));//Output the numeric value of the remainder of the string
}

console.log(
	validator.get(
		"a_custom_string",
		my_custom_validator//Notice that this is just passing the function in, not calling it as per the standard bval functions
	)
);

console.log(
	validator.get(
		"a_custom_string2",
		my_custom_validator
	)
);


var error = validator.end();
console.log('\nerror:');
console.log(JSON.stringify(error, null, 2));