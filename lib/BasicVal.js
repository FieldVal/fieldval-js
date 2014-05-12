module.exports = {
    is_type: function(desired_type, stop_if_error) {

        return [
            function(value, emit) {

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
            },
            stop_if_error
        ];
    },
    min_length: function(min_len, stop_if_error) {
        return [
            function(value) {
                if (value.length < min_len) {
                    return Validator.BasicErrors.too_short(min_len)
                }
            },
            stop_if_error
        ];
    },
    max_length: function(max_len, stop_if_error) {
        return [
            function(value) {
                if (value.length > max_len) {
                    return Validator.BasicErrors.too_long(max_len);
                }
            },
            stop_if_error
        ];
    },
    minimum: function(min_val, stop_if_error) {
        return [
            function(value) {
                if (value < min_val) {
                    return Validator.BasicErrors.too_small(min_val);
                }
            },
            stop_if_error
        ];
    },
    maximum: function(max_val, stop_if_error) {
        return [
            function(value) {
                if (value > max_val) {
                    return Validator.BasicErrors.too_large(max_val);
                }
            },
            stop_if_error
        ];
    },
    range: function(min_val, max_val) {
        //Effectively combines minimum and maximum
        return [
            function(value) {
                if (value < min_val) {
                    return Validator.BasicErrors.too_small(min_val);
                } else if (value > max_val) {
                    return Validator.BasicErrors.too_large(max_val);
                }
            },
            stop_if_error
        ];
    },
    is_one_of: function(array, stop_if_error) {
        return [
            function(value) {
                if (array.indexOf(value) === -1) {
                    return Validator.BasicErrors.not_in_list();
                }
            },
            stop_if_error
        ];
    },
    not_empty: function(trim, stop_if_error) {
        return [
            function(value) {
                if (trim) {
                    if (value.trim().length === 0) {
                        return Validator.BasicErrors.cannot_be_empty();
                    }
                } else {
                    if (value.length === 0) {
                        return Validator.BasicErrors.cannot_be_empty();
                    }
                }
            },
            stop_if_error
        ];
    },
    prefix: function(prefix, stop_if_error) {
        return [
            function(value) {
                if (value.length >= prefix.length) {
                    if (value.substring(0, prefix.length) != prefix) {
                        return Validator.BasicErrors.no_prefix(prefix);
                    }
                } else {
                    return Validator.BasicErrors.no_prefix(prefix);
                }
            },
            stop_if_error
        ];
    },
    each: function(on_each, stop_if_error) {
        return [
            function(array, stop) {
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
            },
            stop_if_error
        ];
    }
}