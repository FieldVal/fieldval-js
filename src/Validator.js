Validator = function(validating) {
    var fv = this;

    fv.validating = validating;
    fv.missing_keys = {};
    fv.missing_count = 0;
    fv.invalid_keys = {};
    fv.invalid_count = 0;
    fv.unrecognized_keys = {};
    fv.unrecognized_count = 0;
    fv.recognized_keys = {};
}

Validator.REQUIRED_ERROR = "required";
Validator.NOT_REQUIRED_BUT_MISSING = "notrequired";

Validator.ONE_OR_MORE_ERRORS = 0;
Validator.FIELD_MISSING = 1;
Validator.INCORRECT_FIELD_TYPE = 2;
Validator.FIELD_UNRECOGNIZED = 3;
Validator.MULTIPLE_ERRORS = 4;

Validator.get_value_and_type = function(value, desired_type) {
    if (desired_type == "integer") {
        var parsed = parseInt(value);
        if (!isNaN(parsed) && ("" + parsed).length == ("" + value).length) {
            value = parsed;
            desired_type = parsed;
            desired_type = "number";
        }
    } else if (desired_type == "float") {
        var parsed = parseFloat(value);
        if (!isNaN(parsed)) {
            value = parsed;
            desired_type = "number";
        }
    }

    var type = typeof value;

    if (type == "object") {
        //typeof on Array returns "object", do check for an array
        if (Object.prototype.toString.call(value) === '[object Array]') {
            type = "array";
        }
    }

    return {
        type: type,
        desired_type: desired_type,
        value: value
    };
}

Validator.prototype = {

    get: function(field_name, desired_type, required) {
        var fv = this;

        var value = fv.validating[field_name];

        fv.recognized_keys[field_name] = true;

        if (arguments.length > 1) {
            //Additional checks

            var should_stop = false;
            var had_error = false;
            var stop = function(){
                should_stop = true;
            }
            for (var i = 1; i < arguments.length; i++) {
                var stop_if_error;
                var this_operator = arguments[i];
                var this_operator_function;
                if((typeof this_operator)!=="function"){
                    this_operator_function = this_operator[0];
                    flags = this_operator[1];
                    if(flags!=null && flags.stop_if_error){
                        stop_if_error = true;
                    }
                } else {
                    this_operator_function = this_operator;
                    stop_if_error = true;//defaults to true
                }

                var check = this_operator_function(value, function(new_value){
                    value = new_value;
                });
                if (check != null) {
                    if(check===Validator.REQUIRED_ERROR){
                        fv.missing(field_name);   
                        had_error = true;
                    } else if(check===Validator.NOT_REQUIRED_BUT_MISSING){
                        had_error = true;//Don't process proceeding operators, but don't throw an error
                    } else {
                        fv.invalid(field_name, check);
                        had_error = true;
                    }
                    if(stop_if_error){
                        break;
                    }
                }
            }
            if (had_error) {
                return null;
            }
        }

        return value;
    },

    invalid: function(field_name, error) {
        var fv = this;

        var existing = fv.invalid_keys[field_name];
        if (existing != null) {
            //Add to an existing error
            if (existing.errors != null) {
                existing.errors.push(error);
            } else {
                fv.invalid_keys[field_name] = {
                    error: Validator.MULTIPLE_ERRORS,
                    error_message: "Multiple errors.",
                    errors: [existing, error]
                }
            }
        } else {
            fv.invalid_keys[field_name] = error;
            fv.invalid_count++;
        }
        return this;
    },

    missing: function(field_name) {
        var fv = this;

        fv.missing_keys[field_name] = {
            error_message: "Field missing.",
            error: Validator.FIELD_MISSING
        };
        fv.missing_count++;
        return this;
    },

    unrecognized: function(field_name) {
        var fv = this;

        fv.unrecognized_keys[field_name] = {
            error_message: "Unrecognized field.",
            error: Validator.FIELD_UNRECOGNIZED
        };
        fv.unrecognized_count++;
        return this;
    },

    recognized: function(field_name){
        var fv = this;

        fv.recognized_keys[field_name] = true;
    },

    //Exists to allow processing of remaining keys after known keys are checked
    get_unrecognized: function(){
        var fv = this;

        var unrecognized = [];
        for (var key in fv.validating) {
            if (fv.recognized_keys[key] != true) {
                unrecognized.push(key);
            }
        }
        return unrecognized;
    },

    end: function() {
        var fv = this;

        var returning = {};

        var has_error = false;

        var unrecognized = fv.get_unrecognized();
        for(var key in unrecognized){
            fv.unrecognized(unrecognized[key]);
        }

        if(fv.missing_count !== 0) {
            returning.missing = fv.missing_keys;
            has_error = true;
        }
        if(fv.invalid_count !== 0) {
            returning.invalid = fv.invalid_keys;
            has_error = true;
        }
        if(fv.unrecognized_count !== 0) {
            returning.unrecognized = fv.unrecognized_keys;
            has_error = true;
        }

        if (has_error) {
            returning.error_message = "One or more errors.";
            returning.error = Validator.ONE_OR_MORE_ERRORS;
            return returning;
        }

        return null;
    }
}

Validator.Error = function(number, message, data) {
    if (((typeof number)==='object') && Object.prototype.toString.call(number) === '[object Array]') {
        var array = number;
        number = array[0];
        message = array[1];
        data = array[2];
    }
    var obj = {
        error: number
    };
    if (message != null) {
        obj.error_message = message;
    }
    if (data != null) {
        obj.data = data;
    }
    return obj;
}

@import("BasicVal.js");
@import("BasicErrors.js");

if (typeof module != 'undefined') {
    module.exports = Validator;
}