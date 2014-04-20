var Validator = require('../lib/fieldval');
var bval = require('../lib/fieldval').BasicVal;


console.log("*************");
console.log("This example shows simple usage of FieldVal.js");
console.log("=============");
console.log("The data to be validated (my_data) contains 3 keys. \n\
validator.get() is used on two of the keys and also on a third that \n\
isn't present. When validator.end() is called, the returned error \n\
contains an error for the key that was unrecognized (in the data, but \n\
not checked for) and an error for the missing key (checked for, but \n\
not in the data)");
console.log("*************\n");


//The object to validate
var data = {
    a_number: 57,
    some_text: "This is a string",
    curveball: "I wasn't expected"
}
console.log("data:");
console.log(JSON.stringify(data, null, 2));


//Create a FieldVal validator for the object
var validator = new Validator(data);


//Get values using validator.get(field_name, field_type, required)
var a_number = validator.get("a_number", "integer", true);
var some_text = validator.get("some_text", "string", true);
var another_string = validator.get("another_string", "string", true);
console.log("\nvalues:");
console.log(JSON.stringify({
    a_number: a_number,
    some_text: some_text,
    another_string: another_string
}, null, 2));

//Create an error for the validation (null if no errors)
var error = validator.end();
console.log("\nerror:");
console.log(JSON.stringify(error, null, 2));