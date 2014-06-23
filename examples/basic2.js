var FieldVal = require('fieldval');
var bval = require('fieldval-basicval');

var my_data = {
	"my_integer": 18,
	"my_string": "ABDEFGHHIJKLMNOPQRSTUVWYZ",
	"my_value" : 578.9,
	"curveball": "Not expected!"
}
console.log('\nmy_data:');
console.log(JSON.stringify(my_data, null, 2));

// Create a new FieldVal FieldVal for my_data
var validator = new FieldVal(my_data);

validator.get('my_string', bval.string(true), bval.prefix("ABC", {stop_on_error: false}), bval.suffix("XYZ"));

var my_value = validator.get("my_value", bval.float(true, {parse: true}), function(value, emit){
	if(value<500){
		emit(Math.floor(value));
	} else {
		emit(Math.ceil(value));
	}
}, bval.minimum(500));

console.log(my_value);
validator.get('my_array', bval.array(true));

var error = validator.end();
console.log(JSON.stringify(error, null, 2));