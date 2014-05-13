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
    object: function(required,flags){
        return Validator.BasicVal.type("object",required,flags);
    },
    float: function(required,flags){
        return Validator.BasicVal.type("float",required,flags);
    },
    boolean: function(required,flags){
        return Validator.BasicVal.type("boolean",required,flags);
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