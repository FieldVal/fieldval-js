var Validator = require('../lib/fieldval');
var bval = Validator.BasicVal;

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

// Create a new FieldVal Validator for my_data
var validator = new Validator(my_data);

// Get values using validator.get(field_name [,validators...])
console.log("some_text: "+validator.get('some_text', bval.required(true), bval.is_type("string")));
console.log("another_string: "+validator.get('another_string', bval.required(true), bval.is_type("string")));
console.log("a_number: "+validator.get('a_number', bval.required(true), bval.is_type("integer")));

// When validator.end() is called, the returned error contains an error
// for the key that was unrecognized ('curveball') and an error for the 
// missing key ('another_string').
var error = validator.end();
console.log('\nerror:');
console.log(JSON.stringify(error, null, 2));