var FieldVal = require('fieldval');
var bval = require('fieldval-basicval');

console.log('=============\n\
This example shows simple usage of FieldVal.js\n\
=============');




// The data to be validated (my_data) contains 3 keys.
var my_data = {
    a_number: 57,
    some_text: 'This is a string',
    curveball: 'I wasn\'t expected'
}
console.log('\nmy_data:');
console.log(JSON.stringify(my_data, null, 2));




// Create a new FieldVal FieldVal for my_data
var validator = new FieldVal(my_data);




//Create a new object to hold the validate values
var values = {};

// Get values using validator.get(field_name [,validators...]) and log them
values.some_text = validator.get('some_text', bval.string(true));
console.log("some_text: "+values.some_text);

values.another_string = validator.get('another_string', bval.string({required:true, missing_error: {
	error_message: "I'm a custom missing error!"
}}));
console.log("another_string: "+values.another_string);

values.a_number = validator.get('a_number', bval.integer(true));
console.log("a_number: "+values.a_number);



// When validator.end() is called, the returned error contains an error
// for the key that was unrecognized ('curveball') and an error for the 
// missing key ('another_string').
var error = validator.end();
console.log('\nerror:');
console.log(JSON.stringify(error, null, 2));



//This is a test too, and it needs to be exported
module.exports = {
	values: values,
	error: error
}