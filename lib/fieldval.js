Validator = function(validating) {
    this.validating = validating;
    this.missing_keys = {};
    this.missing_count = 0;
    this.invalid_keys = {};
    this.invalid_count = 0;
    this.unrecognized_keys = {};
    this.unrecognized_count = 0;
    this.recognized_keys = {};
}

Validator.ONE_OR_MORE_ERRORS = 0;
Validator.FIELD_MISSING = 1;
Validator.INCORRECT_FIELD_TYPE = 2;
Validator.FIELD_UNRECOGNIZED = 3;
Validator.MULTIPLE_ERRORS = 4;

Validator.get_value_and_type = function(value, desired_type) {
    if (desired_type == "integer") {
        var parsed = parseInt(value);
        if (!isNaN(parsed) && ("" + parsed).length == ("" + value).length) {
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

        if (required == null) {
            required = true;
        }

        var value = this.validating[field_name];

        this.recognized_keys[field_name] = true;

        var value_and_type = Validator.get_value_and_type(value, desired_type);

        //Desired type can be changed because the correct type is known
        var desired_type = value_and_type.desired_type;
        var type = value_and_type.type;
        var value = value_and_type.value;

        if (type !== 'undefined' && type !== desired_type) {
            this.invalid(field_name,{
                error_message: "Incorrect field type. Expected " + desired_type + ".",
                error: Validator.INCORRECT_FIELD_TYPE,
                expected: desired_type,
                received: type
            });
            return null;
        } else if (type === 'undefined') {
            if (required === true) {
                this.missing(field_name);
            }
            return null;
        }

        if (arguments.length > 3) {
            //Additional checks

            var had_error = false;
            for (var i = 3; i < arguments.length; i++) {
                var check = arguments[i](value, had_error, function(new_value){
                    value = new_value;
                });
                if (check != null) {
                    this.invalid(field_name, check);
                    had_error = true;
                }
            }
            if (had_error) {
                return null;
            }
        }

        return value;
    },

    invalid: function(field_name, error) {
        var existing = this.invalid_keys[field_name];
        if (existing != null) {
            //Add to an existing error
            if (existing.errors != null) {
                existing.errors.push(error);
            } else {
                this.invalid_keys[field_name] = {
                    error: Validator.MULTIPLE_ERRORS,
                    error_message: "Multiple errors.",
                    errors: [existing, error]
                }
            }
        } else {
            this.invalid_keys[field_name] = error;
            this.invalid_count++;
        }
        return this;
    },

    missing: function(field_name) {
        this.missing_keys[field_name] = {
            error_message: "Field missing.",
            error: Validator.FIELD_MISSING
        };
        this.missing_count++;
        return this;
    },

    unrecognized: function(field_name) {
        this.unrecognized_keys[field_name] = {
            error_message: "Unrecognized field.",
            error: Validator.FIELD_UNRECOGNIZED
        };
        this.unrecognized_count++;
        return this;
    },

    recognized: function(field_name){
        this.recognized_keys[field_name] = true;
    },

    //Exists to allow processing of remaining keys after known keys are checked
    get_unrecognized: function(){
        var unrecognized = [];
        for (var key in this.validating) {
            if (this.recognized_keys[key] != true) {
                unrecognized.push(key);
            }
        }
        return unrecognized;
    },

    end: function() {
        var returning = {};

        var has_error = false;

        var unrecognized = this.get_unrecognized();
        for(var key in unrecognized){
            this.unrecognized(unrecognized[key]);
        }

        if(this.missing_count !== 0) {
            returning.missing = this.missing_keys;
            has_error = true;
        }
        if(this.invalid_count !== 0) {
            returning.invalid = this.invalid_keys;
            has_error = true;
        }
        if(this.unrecognized_count !== 0) {
            returning.unrecognized = this.unrecognized_keys;
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

Validator.BasicErrors = {
    too_short: function(min_len) {
        return {
            error: 10,
            error_message: "Length is less than " + min_len
        }
    },
    too_long: function(max_len) {
        return {
            error: 11,
            error_message: "Length is greater than " + max_len
        }
    },
    too_small: function(min_val) {
        return {
            error: 12,
            error_message: "Value is less than " + min_val
        }
    },
    too_large: function(max_val) {
        return {
            error: 13,
            error_message: "Value is greater than " + max_val
        }
    },
    not_in_list: function() {
        return {
            error: 14,
            error_message: "Value is not in the allowed list"
        }
    },
    cannot_be_empty: function() {
        return {
            error: 15,
            error_message: "Value cannot be empty."
        }
    },
    no_prefix: function(prefix) {
        return {
            error: 16,
            error_message: "Value does not have prefix: " + prefix
        }
    }
}

Validator.BasicVal = {
    is_type: function(desired_type, stop_if_error) {

        console.log("d1: " + desired_type);

        return function(value, has_error, emit) {

            console.log("d2: " + desired_type);

            if (has_error === true && stop_if_error === true) {
                return;
            }
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
    },
    min_length: function(min_len, stop_if_error) {
        return function(value, has_error) {
            if (has_error === true && stop_if_error === true) {
                return;
            }
            if (value.length < min_len) {
                return Validator.BasicErrors.too_short(min_len)
            }
        }
    },
    max_length: function(max_len, stop_if_error) {
        return function(value, has_error) {
            if (has_error === true && stop_if_error === true) {
                return;
            }
            if (value.length > max_len) {
                return Validator.BasicErrors.too_long(max_len);
            }
        }
    },
    minimum: function(min_val, stop_if_error) {
        return function(value, has_error) {
            if (has_error === true && stop_if_error === true) {
                return;
            }
            if (value < min_val) {
                return Validator.BasicErrors.too_small(min_val);
            }
        }
    },
    maximum: function(max_val, stop_if_error) {
        return function(value, has_error) {
            if (has_error === true && stop_if_error === true) {
                return;
            }
            if (value > max_val) {
                return Validator.BasicErrors.too_large(max_val);
            }
        }
    },
    range: function(min_val, max_val, stop_if_error) {
        //Effectively combines minimum and maximum
        return function(value, has_error) {
            if (has_error === true && stop_if_error === true) {
                return;
            }
            if (value < min_val) {
                return Validator.BasicErrors.too_small(min_val);
            }
            if (value > max_val) {
                return Validator.BasicErrors.too_large(max_val);
            }
        }
    },
    is_one_of: function(array, stop_if_error) {
        return function(value, has_error) {
            if (has_error === true && stop_if_error === true) {
                return;
            }
            if (array.indexOf(value) === -1) {
                return Validator.BasicErrors.not_in_list();
            }
        }
    },
    not_empty: function(trim, stop_if_error) {
        return function(value, has_error) {
            if (has_error === true && stop_if_error === true) {
                return;
            }
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
    },
    prefix: function(prefix, stop_if_error) {
        return function(value, has_error) {
            if (has_error === true && stop_if_error === true) {
                return;
            }
            if (value.length >= prefix.length) {
                if (value.substring(0, prefix.length) != prefix) {
                    return Validator.BasicErrors.no_prefix(prefix);
                }
            } else {
                return Validator.BasicErrors.no_prefix(prefix);
            }
        }
    },
    each: function(on_each, stop_if_error) {
        return function(array, has_error) {
            if (has_error === true && stop_if_error === true) {
                return;
            }
            var validator = new Validator(null);
            for (var i = 0; i < array.length; i++) {
                var value = array[i];

                var res = on_each(value,i);
                if (res != null) {
                    validator.invalid("" + i, res);
                }
            }
            return validator.end();
        }
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

if (typeof module != 'undefined') {
    module.exports = Validator;
}