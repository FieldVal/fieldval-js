//Import FieldVal and BasicVal
var FieldVal = require('../fieldval')
var bval = FieldVal.BasicVal;

//Have some data to validate
var data = {
    my_number: 56
}

//Create a FieldVal instance using the data
var validator = new FieldVal(data);

//Get values using validator.get_async(field_name, check_array, [callback])
validator.get_async("my_number", [bval.integer(true), function(val,emit,done){
	setTimeout(function(){
		done({
			"error": 1000,
			"error_message": "I don't like that number"
		})
	},500);
}], function(val){//After validation
	console.log("my_number: ",val);
});

//Log the result of the validation (null if no errors)
validator.end(function(error){
	console.log(JSON.stringify(error, null, 4));
});