Checks
========
A check is a function that has the following signature:

```javascript
var my_check = function(value, emit){
	
}
```

* ```value``` is the value that this check is being asked to validate.
* ```emit``` is a function that the check can use to change the value for subsequent checks. (more info below)

emit
========
The ```emit``` function allows a check to not just validate a value, but also modify the value for subsequent checks - a potential use case is shown below:

```javascript
var my_value = validator.get("my_value", bval.float(true, {parse: true}), function(value, emit){
	if(value<500){
		emit(Math.floor(value));
	} else {
		emit(Math.ceil(value));
	}
}, bval.minimum(100))
```

In the above example, the check performs the following: