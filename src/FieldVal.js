"use strict";

/* istanbul ignore if */
if (!Array.isArray) {
    Array.isArray = function (value) {
        return (Object.prototype.toString.call(value) === '[object Array]');
    };
}

function FieldVal(validating) {
    var fv = this;

    fv.async_waiting = 0;

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

/* Global namespaces (e.g. Math.sqrt) are used as constants 
 * to prevent multiple instances of FieldVal (due to being 
 * a dependency) having not-strictly-equal constants. */
FieldVal.ASYNC = -1;
FieldVal.REQUIRED_ERROR = Math.sqrt;
FieldVal.NOT_REQUIRED_BUT_MISSING = Math.floor;

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
        } else if (desired_type === "float" || desired_type === "number") {
            var parsed_float = parseFloat(value, 10);
            if (!isNaN(parsed_float) && (parsed_float.toString()).length === (value.toString()).length) {
                value = parsed_float;
                desired_type = "number";
            }
        }
    }

    var type = typeof value;

    if (type === "object") {
        //typeof on Array returns "object", do check for an array
        if (Array.isArray(value)) {
            type = "array";
        }
    }

    return {
        type: type,
        desired_type: desired_type,
        value: value
    };
};

FieldVal.use_check = function (this_check, shared_flags, use_check_done) {

    var this_check_function;
    var stop_on_error = true;//Default to true
    var flags = {};
    var i = 0;

    if ((typeof this_check) === 'object') {
        if (Array.isArray(this_check)) {
            var this_check_array = this_check;
            var check_done = function(){
                i++;
                if(shared_flags.stop || i>this_check_array.length){
                    use_check_done();
                    return;
                }
                FieldVal.use_check(
                    this_check_array[i-1],
                    shared_flags,
                    function(){
                        check_done();
                    }
                );
            }
            check_done();
            return;
        } else {
            flags = this_check;
            this_check_function = flags.check;
            if (flags !== null && (flags.stop_on_error !== undefined)) {
                stop_on_error = flags.stop_on_error;
            }
        }
    } else if(typeof this_check === 'function') {
        this_check_function = this_check;
        stop_on_error = true;//defaults to true
    } else {
        throw new Error("A check can only be provided as a function or as an object with a function as the .check property.");
    }

    var with_response = function(response){
        if (response !== null && response !== undefined) {
            if (stop_on_error) {
                shared_flags.stop = true;
            }
            shared_flags.had_error = true;

            if (response === FieldVal.REQUIRED_ERROR) {

                if (shared_flags.field_name) {
                    shared_flags.validator.missing(shared_flags.field_name, flags);
                    use_check_done();
                    return;
                } else {
                    if (shared_flags.existing_validator) {
                    
                        shared_flags.validator.error(
                            FieldVal.create_error(FieldVal.MISSING_ERROR, flags)
                        );
                        use_check_done();
                        return;
                    } else {
                        shared_flags.return_missing = true;
                        use_check_done();
                        return;
                    }
                }
            } else if (response !== FieldVal.NOT_REQUIRED_BUT_MISSING) {
                //NOT_REQUIRED_BUT_MISSING means "don't process proceeding checks, but don't throw an error"

                if (shared_flags.existing_validator) {
                    if (shared_flags.field_name) {
                        shared_flags.validator.invalid(shared_flags.field_name, response);
                    } else {
                        shared_flags.validator.error(response);
                    }
                    use_check_done();
                } else {
                    shared_flags.validator.error(response);
                    use_check_done();
                }
            }
        } else {
            use_check_done();
        }
    }

    var check_response = this_check_function(shared_flags.value, shared_flags.emit, function(response){
        //Response callback
        with_response(response);
    });
    if (check_response===FieldVal.ASYNC){
        //Waiting for async
    } else {
        with_response(check_response);
    }
};

FieldVal.use_checks = function (value, checks, existing_validator, field_name, emit, done) {

    var shared_flags = {
        value: value,
        field_name: field_name,
        emit: function(emitted){
            shared_flags.value = emitted;
        },
        external_emit: emit,
        stop: false,
        return_missing: false,
        had_error: false
    }

    if (existing_validator) {
        shared_flags.validator = existing_validator;
        shared_flags.existing_validator = true;
    } else {
        shared_flags.validator = new FieldVal();
    }

    var to_return = undefined;
    var finish = function(response){
        to_return = response;
    }
    shared_flags.validator.async_waiting++;
    
    var use_check_res = FieldVal.use_check(checks || [], shared_flags, function(){
        if (shared_flags.had_error) {
            if (shared_flags.external_emit) {
                shared_flags.external_emit(undefined);
            }
        } else {
            if (shared_flags.external_emit) {
                shared_flags.external_emit(shared_flags.value);
            }
        }

        if (shared_flags.return_missing) {
            finish(FieldVal.REQUIRED_ERROR);
            return;
        }

        if(!shared_flags.existing_validator){
            finish(shared_flags.validator.end());
            return;
        }

        shared_flags.validator.async_call_ended();
    })
    if(to_return!==undefined){
        return to_return;
    } else {
        finish = done;
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

    var required = (flags && flags.required !== undefined) ? flags.required : true;

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

FieldVal.prototype.default_value = function (default_value) {
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
        /* istanbul ignore else */
        if (fv.validating.hasOwnProperty(key)) {
            if (fv.recognized_keys[key] !== true) {
                unrecognized.push(key);
            }
        }
    }
    return unrecognized;
};

FieldVal.prototype.async_call_ended = function(){
    var fv = this;

    fv.async_waiting--;

    if(fv.async_waiting<=0){
        if(fv.end_callback){
            fv.end_callback(fv.generate_response());
        }
    }
}

FieldVal.prototype.generate_response = function(){
    var fv = this;

    var returning = {};

    var has_error = false;

    var returning_unrecognized = {};
    var returning_unrecognized_count = 0;

    //Iterate through manually unrecognized keys
    var key;
    for (key in fv.unrecognized_keys) {
        /* istanbul ignore else */
        if (fv.unrecognized_keys.hasOwnProperty(key)) {
            returning_unrecognized[key] = fv.unrecognized_keys[key];
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
}

FieldVal.prototype.end = function (callback) {
    var fv = this;

    if(callback){
        fv.end_callback = callback;

        if(fv.async_waiting<=0){
            callback(fv.generate_response());
        }
    } else {
        return fv.generate_response();
    }
};

FieldVal.create_error = function (default_error, flags) {
    if (!flags) {
        return default_error.apply(null, Array.prototype.slice.call(arguments, 2));
    }
    if (default_error === FieldVal.MISSING_ERROR) {
        var missing_error_type = typeof flags.missing_error;

        /* istanbul ignore else */
        if (missing_error_type === 'function') {
            return flags.missing_error.apply(null, Array.prototype.slice.call(arguments, 2));
        } else if (missing_error_type === 'object') {
            return flags.missing_error;
        } else if (missing_error_type === 'string') {
            return {
                error_message: flags.missing_error
            };
        }
    } else {
        var error_type = typeof flags.error;

        /* istanbul ignore else */
        if (error_type === 'function') {
            return flags.error.apply(null, Array.prototype.slice.call(arguments, 2));
        } else if (error_type === 'object') {
            return flags.error;
        } else if (error_type === 'string') {
            return {
                error_message: flags.error
            };
        }
    }

    return default_error.apply(null, Array.prototype.slice.call(arguments, 2));
};

/* istanbul ignore else */
if ('undefined' !== typeof module) {
    module.exports = FieldVal;
}