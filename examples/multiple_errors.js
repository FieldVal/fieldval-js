//Import FieldVal and FieldVal-BasicVal (some simple checks)
var FieldVal = require('../fieldval')
var bval = FieldVal.BasicVal;

//Have some data to validate
var data = {
    my_boolean: 17//Not a boolean
}

//Create a FieldVal instance using the data
var validator = new FieldVal(data);

//Get values using validator.get(field_name, field_type, required)
var my_boolean = validator.get("my_boolean", bval.boolean(true));

validator.invalid("my_boolean",{
	error: 99,
	error_message: "I'm another error!"
})

//Log the result of the validation (null if no errors)
var error = validator.end();
console.log(JSON.stringify(error, null, 4));