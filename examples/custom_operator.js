var Validator = require('../lib/fieldval');

console.log('=============\n\
This example shows custom operator usage of FieldVal.js\n\
=============');

// The data to be validated (my_data) contains 3 keys.
var my_data = {
    a_custom_string: 'ABC123',
    a_custom_string2: 'ABCD12',
}
console.log('\nmy_data:');
console.log(JSON.stringify(my_data, null, 2));


// Create a new FieldVal Validator for my_data
var validator = new Validator(my_data);





var error = validator.end();
console.log('error:');
console.log(JSON.stringify(error, null, 2));