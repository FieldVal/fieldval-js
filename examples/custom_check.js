var FieldVal = require('fieldval');
var bval = require('fieldval-basicval');

console.log('=============\n\
This example shows custom check usage of FieldVal.js\n\
=============');




// The data to be validated (my_data) contains 3 keys.
var my_data = {
    a_custom_string: 'ABC123',
    a_custom_string2: 'ABC-12',
    a_custom_string3: 'DEF1234',
}
console.log('\nmy_data:');
console.log(JSON.stringify(my_data, null, 2));



// Create a new FieldVal FieldVal for my_data
var validator = new FieldVal(my_data);


var my_custom_check = function(value,emit){
	var checks = [
		bval.string(true),//Must be a string
		bval.prefix("ABC"),//Must start with "ABC"
		bval.length(6)//Must be 6 characters in length
	]
	var error = FieldVal.use_checks(value,checks);
	if(error)return error;

	var suffix = value.substring(3);
	var number;
	var error = bval.integer(true, {parse:true}).check(suffix,function(int_value){
		number = int_value;
	}); if(error)return error;
	var error = bval.minimum(0)(number); if(error) return error;

	emit(number);//Output the numeric value of the suffix of the string
}


//Create a new object to hold the validate values
var values = {};

values.a_custom_string = validator.get(
	"a_custom_string",
	my_custom_check,//This is just passing the function in, not calling it as per the standard bval functions
	bval.minimum(500)//This is a check against the numeric value that was emitted in my_custom_check
)
console.log("a_custom_string: "+values.a_custom_string);

values.a_custom_string2 = validator.get(
	"a_custom_string2",
	my_custom_check
)
console.log("a_custom_string2: "+values.a_custom_string2);

values.a_custom_string3 = validator.get(
	"a_custom_string3",
	my_custom_check
)
console.log("a_custom_string3: "+values.a_custom_string3);




var error = validator.end();
console.log('\nerror:');
console.log(JSON.stringify(error, null, 2));




//This is a test too, and it needs to be exported
module.exports = {
	values: values,
	error: error
}