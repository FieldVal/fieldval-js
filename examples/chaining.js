var FieldVal = require('fieldval');
var bval = require('fieldval-basicval');

console.log('=============\n\
This example shows chaining usage of FieldVal.js. By default an error returned by a\n\
check will stop the chain of checks. This can be bypassed by setting "stop_on_error"\n\
to false in the flags object (the last parameter by convention).\n\
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


// Create a new FieldVal validator for my_data
var validator = new FieldVal(my_data);

console.log("'a_number' if it is an integer and is less than or equal to 30, but also at least 60:")
console.log(
	validator.get(
		'a_number',
		bval.integer(true),
		bval.maximum(30),
		bval.minimum(60)//Intentionally impossible combination
	)
);

//This usage shows that checks can be chained and not stop on errors
console.log("'a_second_number' if it is an integer and is less than or equal to 30, but also at least 60:")
console.log(
	validator.get(
		'a_second_number',
		bval.integer(true),
		bval.maximum(30,{stop_on_error:false}),//Continue onto the next check, even on error 
		bval.minimum(60)//Intentionally impossible combination
	)
);

console.log("'a_string' if it is a string of at least 20 characters:")
console.log(
	validator.get('a_string',
		bval.integer(true),
		bval.min_length(20)
	)
);


console.log("'an_array' if it is an array and every value is an integer greater than 40:")
console.log(
	validator.get(
		'an_array',
		bval.array(true),
		bval.each(function(val,index){
			var error = bval.integer()(val); 
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