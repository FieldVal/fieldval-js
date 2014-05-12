var bval = require('./BasicVal');

var operators = {};

for(var i in bval){
	var this_name = i;
	(function(this_name){
		operators[this_name] = function(){
			return bval[this_name].apply(this,arguments)[0];
		}
	})(this_name);
}

module.exports = operators;