//Import FieldVal and FieldVal-BasicVal (some simple checks)
var FieldVal = require('fieldval');
var bval = require('fieldval-basicval');

//Have some data to validate
var data = {
    my_number: "clearly not a number"
}

//Create a FieldVal instance using the data
var validator = new FieldVal(data);

//Get values using validator.get(field_name, field_type, required)
var my_number = validator.get("my_number", bval.integer(true));

//Log the result of the validation (null if no errors)
var error = validator.end();
console.log(JSON.stringify(error, null, 4));