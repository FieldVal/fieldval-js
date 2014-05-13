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

Validator.BasicVal = {
    required: function(required, flags){//required defaults to true
        var operator = function(value) {
            if (value==null) {
                if(required || required===undefined){
                    return Validator.REQUIRED_ERROR;
                } else {
                    return Validator.NOT_REQUIRED_BUT_MISSING;
                }
            }
        }
        if(flags!==undefined){
            return [operator,flags];
        }
        return operator;
    },
    type: function(desired_type, required, flags) {

        if((typeof required)==="object"){
            flags = required;
            required = typeof flags.required !== 'undefined' ? flags.required : true;
        }

        var operator = function(value, emit) {

            var required_error = Validator.BasicVal.required(required)(value); 
            if(required_error) return required_error;

            var value_and_type = Validator.get_value_and_type(value, desired_type);

            desired_type = value_and_type.desired_type;
            var type = value_and_type.type;
            var value = value_and_type.value;

            if (type !== desired_type) {
                return {
                    error_message: "Incorrect field type. Expected " + desired_type + ".",
                    error: Validator.INCORRECT_FIELD_TYPE,
                    expected: desired_type,
                    received: type
                };
            }
        }
        if(flags!==undefined){
            return [operator,flags];
        }
        return operator;
    },
    integer: function(required,flags){
        return Validator.BasicVal.type("integer",required,flags);
    },
    array: function(required,flags){
        return Validator.BasicVal.type("array",required,flags);
    },
    float: function(required,flags){
        return Validator.BasicVal.type("float",required,flags);
    },
    string: function(required,flags){
        return Validator.BasicVal.type("string",required,flags);
    },
    min_length: function(min_len, flags) {
        var operator = function(value) {
            if (value.length < min_len) {
                return Validator.BasicErrors.too_short(min_len)
            }
        }
        if(flags!==undefined){
            return [operator,flags];
        }
        return operator;
    },
    max_length: function(max_len, flags) {
        var operator = function(value) {
            if (value.length > max_len) {
                return Validator.BasicErrors.too_long(max_len);
            }
        }
        if(flags!==undefined){
            return [operator,flags];
        }
        return operator;
    },
    minimum: function(min_val, flags) {
        var operator = function(value) {
            if (value < min_val) {
                return Validator.BasicErrors.too_small(min_val);
            }
        }
        if(flags!==undefined){
            return [operator,flags];
        }
        return operator;
    },
    maximum: function(max_val, flags) {
        var operator = function(value) {
            if (value > max_val) {
                return Validator.BasicErrors.too_large(max_val);
            }
        }
        if(flags!==undefined){
            return [operator,flags];
        }
        return operator;
    },
    range: function(min_val, max_val, flags) {
        //Effectively combines minimum and maximum
        var operator = function(value){
            if (value < min_val) {
                return Validator.BasicErrors.too_small(min_val);
            } else if (value > max_val) {
                return Validator.BasicErrors.too_large(max_val);
            }
        }
        if(flags!==undefined){
            return [operator,flags];
        }
        return operator;
    },
    one_of: function(array, flags) {
        var operator = function(value) {
            if (array.indexOf(value) === -1) {
                return Validator.BasicErrors.not_in_list();
            }
        }
        if(flags!==undefined){
            return [operator,flags];
        }
        return operator;
    },
    not_empty: function(trim, flags) {
        var operator = function(value) {
            if (trim) {
                if (value.trim().length === 0) {
                    return Validator.BasicErrors.cannot_be_empty();
                }
            } else {
                if (value.length === 0) {
                    return Validator.BasicErrors.cannot_be_empty();
                }
            }
        }
        if(flags!==undefined){
            return [operator,flags];
        }
        return operator;
    },
    prefix: function(prefix, flags) {
        var operator = function(value) {
            if (value.length >= prefix.length) {
                if (value.substring(0, prefix.length) != prefix) {
                    return Validator.BasicErrors.no_prefix(prefix);
                }
            } else {
                return Validator.BasicErrors.no_prefix(prefix);
            }
        }
        if(flags!==undefined){
            return [operator,flags];
        }
        return operator;
    },
    each: function(on_each, flags) {
        var operator = function(array, stop) {
            var validator = new Validator(null);
            for (var i = 0; i < array.length; i++) {
                var value = array[i];

                var res = on_each(value,i);
                if (res != null) {
                    validator.invalid("" + i, res);
                }
            }
            var error = validator.end();
            if(error!=null){
                return error;
            }
        }
        if(flags!==undefined){
            return [operator,flags];
        }
        return operator;
    }
}
Validator.BasicErrors = {
    too_short: function(min_len) {
        return {
            error: 100,
            error_message: "Length is less than " + min_len
        }
    },
    too_long: function(max_len) {
        return {
            error: 101,
            error_message: "Length is greater than " + max_len
        }
    },
    too_small: function(min_val) {
        return {
            error: 102,
            error_message: "Value is less than " + min_val
        }
    },
    too_large: function(max_val) {
        return {
            error: 103,
            error_message: "Value is greater than " + max_val
        }
    },
    not_in_list: function() {
        return {
            error: 104,
            error_message: "Value is not in the allowed list"
        }
    },
    cannot_be_empty: function() {
        return {
            error: 105,
            error_message: "Value cannot be empty."
        }
    },
    no_prefix: function(prefix) {
        return {
            error: 106,
            error_message: "Value does not have prefix: " + prefix
        }
    }
}

if (typeof module != 'undefined') {
    module.exports = Validator;
}