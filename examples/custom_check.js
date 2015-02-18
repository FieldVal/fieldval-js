var FieldVal = require('../fieldval')
var bval = FieldVal.BasicVal;

console.log('=============\n\
This example shows custom check usage of FieldVal.js\n\
=============');




// The data to be validated (my_data) contains 3 keys.
var my_data = {
    string_one: 'ABC123',
    string_two: 'ABC-12',
    string_three: 'DEF1234',
    string_four: 'ABC550',
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
	var error = bval.minimum(0).check(number); if(error) return error;

	emit(number);//Output the numeric value of the suffix of the string
}


//Create a new object to hold the validate values
var values = {};


//string_one, string_two and string_three are invalid
values.string_one = validator.get(
	"string_one",
	my_custom_check,//This is just passing the function in, not calling it as per the standard bval functions
	bval.minimum(500)//This is a check against the numeric value that was emitted in my_custom_check
)
console.log("string_one: "+values.string_one);

values.string_two = validator.get(
	"string_two",
	my_custom_check,
	bval.minimum(500)
)
console.log("string_two: "+values.string_two);

values.string_three = validator.get(
	"string_three",
	my_custom_check,
	bval.minimum(500)
)
console.log("string_three: "+values.string_three);


//The only valid string
values.string_four = validator.get(
	"string_four",
	my_custom_check,
	bval.minimum(500)
)
console.log("string_four: "+values.string_four);




var error = validator.end();
console.log('\nerror:');
console.log(JSON.stringify(error, null, 2));




//This is a test too, and it needs to be exported
module.exports = {
	values: values,
	error: error
}