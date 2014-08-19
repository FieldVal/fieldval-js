"use strict";

var logger;
if ((typeof require) === 'function') {
    logger = require('tracer').console();
}

if (!Array.isArray) {
    Array.isArray = function (value) {
        return (Object.prototype.toString.call(value) === '[object Array]');
    };
}

function FieldVal(validating) {
    var fv = this;

    fv.validating = validating;
    fv.missing_keys = {};
    fv.missing_count = 0;
    fv.invalid_keys = {};
    fv.invalid_count = 0;
    fv.unrecognized_keys = {};
    fv.unrecognized_count = 0;
    fv.recognized_keys = {};

    //Top level errors - added using .error() 
    fv.errors = [];
}

FieldVal.INCORRECT_TYPE_ERROR = function (expected_type, type) {
    return {
        error_message: "Incorrect field type. Expected " + expected_type + ".",
        error: FieldVal.INCORRECT_FIELD_TYPE,
        expected: expected_type,
        received: type
    };
};

FieldVal.MISSING_ERROR = function () {
    return {
        error_message: "Field missing.",
        error: FieldVal.FIELD_MISSING
    };
};

FieldVal.REQUIRED_ERROR = {};
FieldVal.NOT_REQUIRED_BUT_MISSING = {};

FieldVal.ONE_OR_MORE_ERRORS = 0;
FieldVal.FIELD_MISSING = 1;
FieldVal.INCORRECT_FIELD_TYPE = 2;
FieldVal.FIELD_UNRECOGNIZED = 3;
FieldVal.MULTIPLE_ERRORS = 4;

FieldVal.get_value_and_type = function (value, desired_type, flags) {
    if (!flags) {
        flags = {};
    }
    var parse = flags.parse !== undefined ? flags.parse : false;

    if (typeof value !== 'string' || parse) {
        if (desired_type === "integer") {
            var parsed_int = parseInt(value, 10);
            if (!isNaN(parsed_int) && (parsed_int.toString()).length === (value.toString()).length) {
                value = parsed_int;
                desired_type = parsed_int;
                desired_type = "number";
            }
        } else if (desired_type === "float") {
            var parsed_float = parseFloat(value, 10);
            if (!isNaN(parsed_float)) {
                value = parsed_float;
                desired_type = "number";
            }
        }
    }

    var type = typeof value;

    if (type === "object") {
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
};

FieldVal.use_checks = function (value, checks, existing_validator, field_name, emit) {
    var had_error = false;
    var stop = false;

    var validator;
    if (!existing_validator) {
        validator = new FieldVal();
    }

    var return_missing = false;//Used to escape from check list if a check returns a FieldVal.REQUIRED_ERROR error.

    var use_check = function (this_check) {

        var this_check_function;
        var stop_on_error = true;//Default to true
        var flags = {};
        var i;
        if ((typeof this_check) === 'object') {
            if (Array.isArray(this_check)) {
                for (i = 0; i < this_check.length; i++) {
                    use_check(this_check[i]);
                    if (stop) {
                        break;
                    }
                }
                return;
            }

            flags = this_check;
            this_check_function = flags.check;
            if (flags !== null && (flags.stop_on_error !== undefined)) {
                stop_on_error = flags.stop_on_error;
            }

        } else {
            this_check_function = this_check;
            stop_on_error = true;//defaults to true
        }

        var check = this_check_function(value, function (new_value) {
            value = new_value;
        });
        if (check !== null && check !== undefined) {
            if (check === FieldVal.REQUIRED_ERROR) {
                if (field_name) {
                    if (existing_validator) {
                        existing_validator.missing(field_name, flags);
                    } else {
                        return check;
                    }
                } else {
                    if (existing_validator) {
                        existing_validator.error(
                            FieldVal.create_error(FieldVal.MISSING_ERROR, flags)
                        );
                    } else {
                        return_missing = true;
                        return;
                    }
                }
            } else if (check !== FieldVal.NOT_REQUIRED_BUT_MISSING) {
                //NOT_REQUIRED_BUT_MISSING means "don't process proceeding checks, but don't throw an error"
                if (existing_validator) {
                    if (field_name) {
                        existing_validator.invalid(field_name, check);
                    } else {
                        existing_validator.error(check);
                    }
                } else {
                    validator.error(check);
                }
            }
            had_error = true;
            if (stop_on_error) {
                stop = true;
            }
        }
    };

    var i, this_check;
    for (i = 0; i < checks.length; i++) {
        this_check = checks[i];
        use_check(this_check);
        if (return_missing) {
            return FieldVal.REQUIRED_ERROR;
        }
        if (stop) {
            break;
        }
    }

    if (had_error) {
        if (emit) {
            emit(undefined);
        }
    } else {
        if (emit) {
            emit(value);
        }
    }

    if (!existing_validator) {
        return validator.end();
    }
};

FieldVal.required = function (required, flags) {//required defaults to true
    var check = function (value) {
        if (value === null || value === undefined) {
            if (required || required === undefined) {
                return FieldVal.REQUIRED_ERROR;
            }

            return FieldVal.NOT_REQUIRED_BUT_MISSING;
        }
    };
    if (flags !== undefined) {
        flags.check = check;
        return flags;
    }
    return check;
};

FieldVal.type = function (desired_type, flags) {

    var required = (flags.required !== undefined) ? flags.required : true;

    var check = function (value, emit) {

        var required_error = FieldVal.required(required)(value);

        if (required_error) {
            return required_error;
        }

        var value_and_type = FieldVal.get_value_and_type(value, desired_type, flags);

        var inner_desired_type = value_and_type.desired_type;
        var type = value_and_type.type;
        value = value_and_type.value;

        if (type !== inner_desired_type) {
            return FieldVal.create_error(FieldVal.INCORRECT_TYPE_ERROR, flags, inner_desired_type, type);
        }
        if (emit) {
            emit(value);
        }
    };

    if (flags !== undefined) {
        flags.check = check;
        return flags;
    }

    return check;
};

FieldVal.prototype.default = function (default_value) {
    var fv = this;

    return {
        get: function () {
            var get_result = fv.get.apply(fv, arguments);
            if (get_result !== undefined) {
                return get_result;
            }
            //No value. Return the default
            return default_value;
        }
    };
};

FieldVal.prototype.get = function (field_name) {//Additional arguments are checks
    var fv = this;

    var value = fv.validating[field_name];

    fv.recognized_keys[field_name] = true;

    if (arguments.length > 1) {
        //Additional checks

        var checks = Array.prototype.slice.call(arguments, 1);
        FieldVal.use_checks(value, checks, fv, field_name, function (new_value) {
            value = new_value;
        });
    }

    return value;
};

//Top level error - something that cannot be assigned to a particular key
FieldVal.prototype.error = function (error) {
    var fv = this;

    fv.errors.push(error);

    return fv;
};

FieldVal.prototype.invalid = function (field_name, error) {
    var fv = this;

    var existing = fv.invalid_keys[field_name];
    if (existing !== undefined) {
        //Add to an existing error
        if (existing.errors !== undefined) {
            existing.errors.push(error);
        } else {
            fv.invalid_keys[field_name] = {
                error: FieldVal.MULTIPLE_ERRORS,
                error_message: "Multiple errors.",
                errors: [existing, error]
            };
        }
    } else {
        fv.invalid_keys[field_name] = error;
        fv.invalid_count++;
    }
    return fv;
};

FieldVal.prototype.missing = function (field_name, flags) {
    var fv = this;

    fv.missing_keys[field_name] = FieldVal.create_error(FieldVal.MISSING_ERROR, flags);
    fv.missing_count++;
    return fv;
};

FieldVal.prototype.unrecognized = function (field_name) {
    var fv = this;

    fv.unrecognized_keys[field_name] = {
        error_message: "Unrecognized field.",
        error: FieldVal.FIELD_UNRECOGNIZED
    };
    fv.unrecognized_count++;
    return fv;
};

FieldVal.prototype.recognized = function (field_name) {
    var fv = this;

    fv.recognized_keys[field_name] = true;

    return fv;
};

//Exists to allow processing of remaining keys after known keys are checked
FieldVal.prototype.get_unrecognized = function () {
    var fv = this;

    var unrecognized = [];
    var key;
    for (key in fv.validating) {
        if (fv.validating.hasOwnProperty(key)) {
            if (fv.recognized_keys[key] !== true) {
                unrecognized.push(key);
            }
        }
    }
    return unrecognized;
};

FieldVal.prototype.end = function () {
    var fv = this;

    var returning = {};

    var has_error = false;

    var returning_unrecognized = {};
    var returning_unrecognized_count = 0;

    //Iterate through manually unrecognized keys
    var key;
    for (key in fv.unrecognized) {
        if (fv.unrecognized.hasOwnProperty(key)) {
            returning_unrecognized[key] = fv.unrecognized[key];
            returning_unrecognized_count++;
        }
    }

    var auto_unrecognized = fv.get_unrecognized();
    var i, auto_key;
    for (i = 0; i < auto_unrecognized.length; i++) {
        auto_key = auto_unrecognized[i];
        if (!returning_unrecognized[auto_key]) {
            returning_unrecognized[auto_key] = {
                error_message: "Unrecognized field.",
                error: FieldVal.FIELD_UNRECOGNIZED
            };
            returning_unrecognized_count++;
        }
    }

    if (fv.missing_count !== 0) {
        returning.missing = fv.missing_keys;
        has_error = true;
    }
    if (fv.invalid_count !== 0) {
        returning.invalid = fv.invalid_keys;
        has_error = true;
    }
    if (returning_unrecognized_count !== 0) {
        returning.unrecognized = returning_unrecognized;
        has_error = true;
    }

    if (has_error) {
        returning.error_message = "One or more errors.";
        returning.error = FieldVal.ONE_OR_MORE_ERRORS;

        if (fv.errors.length === 0) {
            return returning;
        }

        fv.errors.push(returning);
    }

    if (fv.errors.length !== 0) {
        //Have top level errors

        if (fv.errors.length === 1) {
            //Only 1 error, just return it
            return fv.errors[0];
        }

        //Return a "multiple errors" error
        return {
            error: FieldVal.MULTIPLE_ERRORS,
            error_message: "Multiple errors.",
            errors: fv.errors
        };
    }

    return null;
};

FieldVal.create_error = function (default_error, flags) {
    if (!flags) {
        return default_error.apply(null, Array.prototype.slice.call(arguments, 2));
    }
    if (default_error === FieldVal.MISSING_ERROR) {
        if ((typeof flags.missing_error) === 'function') {
            return flags.missing_error.apply(null, Array.prototype.slice.call(arguments, 2));
        }
        if ((typeof flags.missing_error) === 'object') {
            return flags.missing_error;
        }
        if ((typeof flags.missing_error) === 'string') {
            return {
                error_message: flags.missing_error
            };
        }
    } else {
        if ((typeof flags.error) === 'function') {
            return flags.error.apply(null, Array.prototype.slice.call(arguments, 2));
        }
        if ((typeof flags.error) === 'object') {
            return flags.error;
        }
        if ((typeof flags.error) === 'string') {
            return {
                error_message: flags.error
            };
        }
    }

    return default_error.apply(null, Array.prototype.slice.call(arguments, 2));
};

FieldVal.Error = function (number, message, data) {

    if (((typeof number) === 'object') && Object.prototype.toString.call(number) === '[object Array]') {
        var array = number;
        number = array[0];
        message = array[1];
        data = array[2];
    }
    var obj = {
        error: number
    };
    if (message !== undefined && message !== null) {
        obj.error_message = message;
    }

    if (data !== undefined && data !== null) {
        obj.data = data;
    }

    return obj;
};

if (module !== undefined) {
    module.exports = FieldVal;
}