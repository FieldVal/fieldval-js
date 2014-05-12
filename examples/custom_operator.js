var Validator = require('../lib/fieldval');
var bval = Validator.BasicVal;

console.log('=============\n\
This example shows custom operator usage of FieldVal.js\n\
=============');

// The data to be validated (my_data) contains 3 keys.
var my_data = {
    a_custom_string: 'ABC123',
    // a_custom_string2: 'ABCD12',
}
console.log('\nmy_data:');
console.log(JSON.stringify(my_data, null, 2));


// Create a new FieldVal Validator for my_data
var validator = new Validator(my_data);


var my_custom_validator = function(){
	return function(val,emit){
		var first_3 = val.substring(0,3);

		if(first_3!=="ABC"){
			return {
				error: 1000,
				error_message: "The string must start with \"ABC\""
			}
		}
		emit(parseInt(val.substring(3)));
	}
}

console.log(
	validator.get(
		"a_custom_string",
		bval.is_required(true),
		bval.is_type("string"),
		my_custom_validator()
	)
);


var error = validator.end();
console.log('error:');
console.log(JSON.stringify(error, null, 2));