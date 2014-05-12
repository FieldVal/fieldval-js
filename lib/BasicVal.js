module.exports = {
    is_required: function(required,stop_if_error){//required defaults to true
        var operator = function(value) {
            if (value==null) {
                if(required || required===undefined){
                    return Validator.REQUIRED_ERROR;
                } else {
                    return Validator.NOT_REQUIRED_BUT_MISSING;
                }
            }
        }
        if(stop_if_error===false){
            return [operator,stop_if_error];
        }
        return operator;
    },
    is_type: function(desired_type, stop_if_error) {

        var operator = function(value, emit) {
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
        if(stop_if_error===false){
            return [operator,stop_if_error];
        }
        return operator;
    },
    min_length: function(min_len, stop_if_error) {
        var operator = function(value) {
            if (value.length < min_len) {
                return Validator.BasicErrors.too_short(min_len)
            }
        }
        if(stop_if_error===false){
            return [operator,stop_if_error];
        }
        return operator;
    },
    max_length: function(max_len, stop_if_error) {
        var operator = function(value) {
            if (value.length > max_len) {
                return Validator.BasicErrors.too_long(max_len);
            }
        }
        if(stop_if_error===false){
            return [operator,stop_if_error];
        }
        return operator;
    },
    minimum: function(min_val, stop_if_error) {
        var operator = function(value) {
            if (value < min_val) {
                return Validator.BasicErrors.too_small(min_val);
            }
        }
        if(stop_if_error===false){
            return [operator,stop_if_error];
        }
        return operator;
    },
    maximum: function(max_val, stop_if_error) {
        var operator = function(value) {
            if (value > max_val) {
                return Validator.BasicErrors.too_large(max_val);
            }
        }
        if(stop_if_error===false){
            return [operator,stop_if_error];
        }
        return operator;
    },
    range: function(min_val, max_val, stop_if_error) {
        //Effectively combines minimum and maximum
        var operator = function(value){
            if (value < min_val) {
                return Validator.BasicErrors.too_small(min_val);
            } else if (value > max_val) {
                return Validator.BasicErrors.too_large(max_val);
            }
        }
        if(stop_if_error===false){
            return [operator,stop_if_error];
        }
        return operator;
    },
    is_one_of: function(array, stop_if_error) {
        var operator = function(value) {
            if (array.indexOf(value) === -1) {
                return Validator.BasicErrors.not_in_list();
            }
        }
        if(stop_if_error===false){
            return [operator,stop_if_error];
        }
        return operator;
    },
    not_empty: function(trim, stop_if_error) {
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
        if(stop_if_error===false){
            return [operator,stop_if_error];
        }
        return operator;
    },
    prefix: function(prefix, stop_if_error) {
        var operator = function(value) {
            if (value.length >= prefix.length) {
                if (value.substring(0, prefix.length) != prefix) {
                    return Validator.BasicErrors.no_prefix(prefix);
                }
            } else {
                return Validator.BasicErrors.no_prefix(prefix);
            }
        }
        if(stop_if_error===false){
            return [operator,stop_if_error];
        }
        return operator;
    },
    each: function(on_each, stop_if_error) {
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
        if(stop_if_error===false){
            return [operator,stop_if_error];
        }
        return operator;
    }
}