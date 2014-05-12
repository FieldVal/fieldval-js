var Validator = require('../lib/fieldval');
var bval = Validator.BasicVal;

console.log('=============\n\
This example shows chaining usage of FieldVal.js. By default an error thrown by an\n\
operator will stop the chain of operators. This can be bypassed by passing "false" as \n\
the last parameter (stop on error)\n\
=============');

// The data to be validated (my_data) contains 3 keys.
var my_data = {
    a_number: 57,
    a_second_number: 57,
    a_string: 'This is a string',
    an_array: [13,41,'a wild string appeared']
}
console.log('\nmy_data:');
console.log(JSON.stringify(my_data, null, 2));


// Create a new FieldVal Validator for my_data
var validator = new Validator(my_data);

console.log("'a_number' if it is an integer and is less than or equal to 30, but also at least 60:")
console.log(
	validator.get(
		'a_number',
		bval.required(true),
		bval.is_type('integer'),
		bval.maximum(30),
		bval.minimum(60)//Intentionally impossible combination
	)
);

//This usage shows that operators can be chained and not stop on errors
console.log("'a_second_number' if it is an integer and is less than or equal to 30, but also at least 60:")
console.log(
	validator.get(
		'a_second_number',
		bval.required(true),
		bval.is_type('integer'),
		bval.maximum(30,{stop_on_error:false}),//Continue onto the next operator, even on error 
		bval.minimum(60)//Intentionally impossible combination
	)
);

console.log("'a_string' if it is a string of at least 20 characters:")
console.log(
	validator.get('a_string',
		bval.required(true),
		bval.is_type('integer'),
		bval.min_length(20)
	)
);


console.log("'an_array' if it is an array and every value is an integer greater than 40:")
console.log(
	validator.get(
		'an_array',
		bval.required(true),
		bval.is_type('array'),
		bval.each(function(val,index){
			var error = bval.is_type('integer')(val); 
			if(error)return error;

			return bval.minimum(40)(val);
		})
	)
);



// When validator.end() is called, the returned error contains errors
// for all three keys.
var error = validator.end();
console.log('error:');
console.log(JSON.stringify(error, null, 2));