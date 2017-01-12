var FieldVal = (function(){
    "use strict";

    /* istanbul ignore next */
    if (!Array.isArray) {
        Array.isArray = function (value) {
            return (Object.prototype.toString.call(value) === '[object Array]');
        };
    }

    var is_empty = function(obj){
        var key;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) return false;
        }
        return true;
    };

    function FieldVal(validating, options) {
        var fv = this;

        fv.async_waiting = 0;

        fv.validating = validating;
        fv.invalid_keys = {};
        fv.recognized_keys = {};

        //Top level errors - added using .error() 
        fv.errors = [];

        fv.options = options || {};
        fv.ignore_unrecognized = fv.options.ignore_unrecognized;

        var existing_error = fv.options.error;
        if(existing_error!==undefined){
            //Provided a (potentially null) existing error

            if(existing_error){
                //Is not null
                
                var key_error;
                if(existing_error.error===FieldVal.ONE_OR_MORE_ERRORS){
                    //The existing_error is a key error
                    key_error = existing_error;
                } else if(existing_error.error===FieldVal.MULTIPLE_ERRORS){
                    for(var i = 0; i < existing_error.errors.length; i++){
                        var inner_error = existing_error.errors[i];

                        if(inner_error.error===FieldVal.ONE_OR_MORE_ERRORS){
                            key_error = inner_error;
                            //Don't add the key_error to fv.errors (continue)
                            continue;
                        }
                        //Add other errors to fv.errors
                        fv.errors.push(inner_error);
                    }
                } else {
                    //Only have non-key error
                    fv.errors.push(existing_error);
                }

                if(key_error){
                    for(var j in validating){
                        if(validating.hasOwnProperty(j)) {
                            fv.recognized_keys[j] = true;
                        }
                    }
                    if(key_error.unrecognized){
                        fv.unrecognized_keys = key_error.unrecognized;
                        for(var k in fv.unrecognized_keys){
                            if(fv.unrecognized_keys.hasOwnProperty(k)) {
                                delete fv.recognized_keys[k];
                            }
                        }
                    }
                    if(key_error.invalid){
                        fv.invalid_keys = key_error.invalid;
                    }

                }
            } else {
                //The existing_error is null, which means a previous validator recognized all fields
                for(var n in validating){
                    if(validating.hasOwnProperty(n)) {
                        fv.recognized_keys[n] = true;
                    }
                }
            }
        }
    }

    FieldVal.prototype.dig = function(){
        var fv = this;

        var keys;
        var first_argument = arguments[0];
        if(Array.isArray(first_argument)){
            keys = first_argument;
        } else {
            keys = arguments;
        }

        var current_value = fv.validating;
        var current_error = fv;
        for(var i = 0; i < keys.length; i++){
            var this_key = keys[i];
            current_value = current_value[this_key];
            if(current_value===undefined){
                return undefined;
            }
            if(current_error){
                var invalid;
                if(current_error instanceof FieldVal){
                    invalid = current_error.invalid_keys;
                } else {
                    invalid = current_error.invalid;
                }
                if(invalid){
                    current_error = invalid[this_key];
                }
            }
        }
        return new FieldVal(current_value,{
            "error": current_error
        });
    };

    FieldVal.get_error = function(){
        var keys;
        var first_argument = arguments[0];
        var last_argument = arguments[arguments.length-1];

        if(typeof last_argument !== "object" || Array.isArray(last_argument)){
            throw new Error("Last argument to .get_error is not an error");
        }
        
        if(Array.isArray(first_argument)){
            keys = first_argument;
        } else {
            keys = [];
            for(var i=0; i < arguments.length-1; i++){
                keys.push(arguments[i]);
            }
        }

        var current_error = last_argument;
        for(var k = 0; k < keys.length; k++){
            var this_key = keys[k];
            if(current_error){
                var invalid = current_error.invalid;
                if(invalid){
                    current_error = invalid[this_key];
                }
            }
        }

        return current_error;
    };

    FieldVal.prototype.error = function(){
        var fv = this;

        //error is the last argument, previous arguments are keys
        var error = arguments[arguments.length-1];

        if(arguments.length===1){
            fv.errors.push(error);
        }

        var keys, keys_length;
        if(arguments.length===2){

            var first_argument = arguments[0];
            if(Array.isArray(first_argument)){
                keys = first_argument;
                keys_length = first_argument.length;
            } else {

                var key_name = arguments[0];

                fv.invalid_keys[key_name] = FieldVal.add_to_invalid(
                    error, 
                    fv.invalid_keys[key_name]
                );
                return fv;
            }
        } else {
            keys = arguments;
            keys_length = arguments.length - 1;
        }

        var current_error = fv;
        for(var i = 0; i < keys_length; i++){
            var this_key = keys[i];

            var current_invalid;
            if(current_error instanceof FieldVal){
                current_invalid = current_error.invalid_keys;
            } else {
                current_invalid = current_error.invalid;
            }

            var new_error;
            if(i===keys_length-1){
                new_error = error;
            } else{
                new_error = current_invalid[this_key];
            }
            if(!new_error){
                new_error = {
                    error: FieldVal.ONE_OR_MORE_ERRORS,
                    error_message: FieldVal.ONE_OR_MORE_ERRORS_STRING
                };
            }

            if(current_error instanceof FieldVal){
                current_error.invalid(this_key, new_error);
            } else {
                if(!current_invalid){
                    current_invalid = current_error.invalid = {};
                }

                current_invalid[this_key] = FieldVal.add_to_invalid(
                    new_error, 
                    current_invalid[this_key]
                );
            }

            current_error = new_error;
        }

        return fv;
    };

    FieldVal.prototype.invalid = FieldVal.prototype.error;

    FieldVal.prototype.get = function (field_name) {//Additional arguments are checks
        var fv = this;

        var checks = Array.prototype.slice.call(arguments, 1);

        var did_return = false;
        var to_return;
        var async_return = fv.get_async(field_name, checks, function(value){
            did_return = true;
            to_return = value;
        });

        if(async_return===FieldVal.ASYNC){
            //At least one of the checks is async
            throw new Error(".get used with async checks, use .get_async.");
        } else {
            return to_return;
        }
    };

    FieldVal.prototype.get_async = function (field_name, checks, done){
        var fv = this;

        if(!Array.isArray(checks)){
            throw new Error(".get_async second argument must be an array of checks");
        }

        var value = fv.validating[field_name];
        fv.recognized_keys[field_name] = true;
        var existing_invalid = fv.invalid_keys[field_name];
        if(existing_invalid!==undefined){
            if(existing_invalid.error!==undefined && existing_invalid.error===FieldVal.FIELD_UNRECOGNIZED){
                //This key was previously unrecognized, but is now being checked - remove the error
                delete fv.invalid_keys[field_name];
            }
        }

        var use_checks_res = FieldVal.use_checks(value, checks, {
            validator: fv, 
            field_name: field_name,
            emit: function (new_value) {
                value = new_value;
            }
        },function(check_result){
            if(done!==undefined){
                done(value);
            }
        });

        return (use_checks_res === FieldVal.ASYNC) ? FieldVal.ASYNC : undefined;
    };

    FieldVal.add_to_invalid = function(this_error, existing){
        var fv = this;

        if (existing !== undefined) {

            //Add to an existing error
            if (existing.errors !== undefined) {
                for(var i = 0; i < existing.errors.length; i++){
                    var inner_error = existing.errors;
                    //If error codes match
                    if(inner_error.error!==undefined && (inner_error.error === this_error.error)){
                        //Replace the error
                        existing.errors[i] = this_error;
                    }
                }
                existing.errors.push(this_error);
            } else {
                //If the error codes match
                if(existing.error!==undefined && (existing.error === this_error.error)){
                    //Replace the error
                    existing = this_error;
                } else {
                    existing = {
                        error: FieldVal.MULTIPLE_ERRORS,
                        error_message: FieldVal.MULTIPLE_ERRORS_STRING,
                        errors: [existing, this_error]
                    };
                }
            }
            return existing;
        } 
        return this_error;
    };

    FieldVal.prototype.missing = function (field_name, options) {
        var fv = this;

        return fv.error(field_name, FieldVal.create_error(FieldVal.MISSING_ERROR, options));
    };

    FieldVal.prototype.unrecognized = function (field_name, options) {
        var fv = this;

        return fv.error(field_name, FieldVal.create_error(FieldVal.UNRECOGNIZED_ERROR, options));
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
    };

    FieldVal.prototype.generate_response = function(){
        var fv = this;

        var returning = {};

        var has_error = false;

        var returning_unrecognized = {};
        var returning_invalid = {};

        //Iterate through manually unrecognized keys
        var key;
        for (key in fv.unrecognized_keys) {
            /* istanbul ignore else */
            if (fv.unrecognized_keys.hasOwnProperty(key)) {
                returning_unrecognized[key] = fv.unrecognized_keys[key];
            }
        }

        if(!fv.ignore_unrecognized){
            var auto_unrecognized = fv.get_unrecognized();
            var i, auto_key;
            for (i = 0; i < auto_unrecognized.length; i++) {
                auto_key = auto_unrecognized[i];
                returning_invalid[auto_key] = {
                    error_message: "Unrecognized field.",
                    error: FieldVal.FIELD_UNRECOGNIZED
                };
                has_error = true;
            }

            if (!is_empty(fv.invalid_keys)) {
                for(var k in fv.invalid_keys){
                    if(fv.invalid_keys.hasOwnProperty(k)){
                        returning_invalid[k] = fv.invalid_keys[k];
                    }
                }
                has_error = true;
            }
        }


        if(has_error){
            returning.invalid = returning_invalid;
        }

        if (has_error) {
            returning.error_message = FieldVal.ONE_OR_MORE_ERRORS_STRING;
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

    FieldVal.prototype.end_with_recognized = function (callback) {
        var fv = this;

        if(callback){
            fv.end(callback);
        } else {
            if(fv.async_waiting>0){
                return [fv.generate_response()];
            }
        }
    };

    /* Global namespaces (e.g. Math.sqrt) are used as constants 
     * to prevent multiple instances of FieldVal (due to being 
     * a dependency) having not-strictly-equal constants. */
    FieldVal.ASYNC = -1;//Used to indicate async functions
    FieldVal.NOT_REQUIRED_BUT_MISSING = Math.floor;

    FieldVal.FIELD_MISSING = 1;
    FieldVal.FIELD_MISSING_STRING = "Field missing.";
    FieldVal.INCORRECT_FIELD_TYPE = 2;
    FieldVal.FIELD_UNRECOGNIZED = 3;
    FieldVal.FIELD_UNRECOGNIZED_STRING = "Unrecognized field.";
    FieldVal.MULTIPLE_ERRORS = 4;
    FieldVal.MULTIPLE_ERRORS_STRING = "Multiple errors.";
    FieldVal.ONE_OR_MORE_ERRORS = 5;
    FieldVal.ONE_OR_MORE_ERRORS_STRING = "One or more errors.";

    FieldVal.INCORRECT_TYPE_ERROR = function (expected_type, type) {
        return {
            error_message: "Incorrect field type. Expected " + expected_type + ", but received "+type+".",
            error: FieldVal.INCORRECT_FIELD_TYPE,
            expected: expected_type,
            received: type
        };
    };

    FieldVal.MISSING_ERROR = function () {
        return {
            error_message: FieldVal.FIELD_MISSING_STRING,
            error: FieldVal.FIELD_MISSING
        };
    };

    FieldVal.UNRECOGNIZED_ERROR = function(){
        return {
            error_message: FieldVal.FIELD_UNRECOGNIZED_STRING,
            error: FieldVal.FIELD_UNRECOGNIZED
        };
    };

    FieldVal.get_value_and_type = function (value, desired_type, options) {
        if (!options) {
            options = {};
        }
        var parse = options.parse !== undefined ? options.parse : false;

        if (typeof value !== 'string' || parse) {
            if (desired_type === "integer") {
                var parsed_int = parseInt(value, 10);
                if (!isNaN(parsed_int) && (parsed_int.toString()).length === (value.toString()).length) {
                    value = parsed_int;
                    desired_type = parsed_int;
                    desired_type = "number";
                }
            } else if (desired_type === "number") {
                var parsed_float = parseFloat(value, 10);
                if (!isNaN(parsed_float) && (parsed_float.toString()).length === (value.toString()).length) {
                    value = parsed_float;
                    desired_type = "number";
                }
            } else if (desired_type === "boolean") {
                if(value === 'true'){
                    value = true;
                }
                if(value === 'false'){
                    value = false;
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

    FieldVal.use_check = function (this_check, shared_options, use_check_done) {

        var this_check_function;
        var stop_on_error = true;//Default to true
        var options = {};
        var i = 0;

        if ((typeof this_check) === 'object') {
            if (Array.isArray(this_check)) {
                var any_async = false;
                var this_check_array = this_check;
                var did_return = false;
                var check_done = function(){
                    i++;
                    if(shared_options.stop || i>this_check_array.length){
                        did_return = true;
                        use_check_done();
                        return;
                    }
                    var check_res = FieldVal.use_check(
                        this_check_array[i-1],
                        shared_options,
                        function(){
                            check_done();
                        }
                    );
                    if(check_res===FieldVal.ASYNC){
                        any_async = true;
                    }
                };
                check_done();
                if(did_return){
                    if(any_async){
                        return FieldVal.ASYNC;
                    } else {
                        return;
                    }
                }
                return FieldVal.ASYNC;
            } else {
                options = this_check;
                this_check_function = options;
                if (options && (options.stop_on_error !== undefined)) {
                    stop_on_error = options.stop_on_error;
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
                    shared_options.stop = true;
                }
                shared_options.had_error = true;

                if (response === FieldVal.NOT_REQUIRED_BUT_MISSING) {
                    //NOT_REQUIRED_BUT_MISSING means "don't process proceeding checks, but don't throw an error"
                    use_check_done();
                } else {

                    if (shared_options.field_name!==undefined) {
                        shared_options.validator.error(shared_options.field_name, response);
                        use_check_done();
                        return;
                    } else {
                        shared_options.validator.error(response);
                        use_check_done();
                        return;
                    }
                }
            } else {
                use_check_done();
            }
        };

        var check_response;
        var actual_function;
        if(typeof this_check_function === 'function') {
            actual_function = this_check_function;
            check_response = this_check_function(shared_options.value, shared_options.emit, function(response){
                //Response callback
                with_response(response);
            });
        } else {
            actual_function = this_check_function.check;
            check_response = this_check_function.check(shared_options.value, shared_options.emit, function(response){
                //Response callback
                with_response(response);
            });
        }
        if (actual_function.length===3){//Is async - it has a third (callback) parameter
            //Waiting for async
            return FieldVal.ASYNC;
        } else {
            with_response(check_response);
            return null;
        }
    };

    FieldVal.use_checks = function (value, checks, options, done) {

        if(typeof options === 'function'){
            done = options;
            options = undefined;
        }

        if(!options){
            options = {};
        }

        var shared_options = {
            value: value,
            field_name: options.field_name,
            emit: function(emitted){
                shared_options.value = emitted;
            },
            options: options,
            stop: false,
            had_error: false
        };

        if (options.validator) {
            shared_options.validator = options.validator;
            shared_options.existing_validator = true;
        } else {
            shared_options.validator = new FieldVal();
        }

        var did_return = false;
        var to_return;
        var finish = function(response){
            to_return = response;
            did_return = true;
            if(done){//The done callback isn't required
                done(response);
            }
        };
        shared_options.validator.async_waiting++;
        
        var use_check_res = FieldVal.use_check(checks || [], shared_options, function(){
            if (shared_options.had_error) {
                if (shared_options.options.emit) {
                    shared_options.options.emit(undefined);
                }
            } else {
                if (shared_options.options.emit) {
                    shared_options.options.emit(shared_options.value);
                }
            }

            if(!shared_options.existing_validator){
                finish(shared_options.validator.end());
                shared_options.validator.async_call_ended();
                return;
            }

            finish(null);
            shared_options.validator.async_call_ended();
            return;
        });
        if(use_check_res===FieldVal.ASYNC){
            if(done){//The done callback isn't required
                finish = done;
            }
            return FieldVal.ASYNC;
        } 
        if(did_return){
            return to_return;
        } else {
            return FieldVal.ASYNC;
        }
    };

    FieldVal.merge_options_and_checks = function(options, check){
        var new_options = {};
        if(options){
            for(var i in options){
                if(options.hasOwnProperty(i)){
                    new_options[i] = options[i];
                }
            }
        }
        new_options.check = check;
        return new_options;
    };

    FieldVal.required = function (required, options) {//required defaults to true
        var check = function (value) {
            if (value === null || value === undefined) {
                if (required || required === undefined) {
                    return FieldVal.create_error(FieldVal.MISSING_ERROR, options);
                }

                return FieldVal.NOT_REQUIRED_BUT_MISSING;
            }
        };
        return FieldVal.merge_options_and_checks(options,check);
    };

    FieldVal.type = function (desired_type, options) {

        var required = (options && options.required !== undefined) ? options.required : true;

        var check = function (value, emit) {

            var required_error = FieldVal.required(required, options || {}).check(value);

            if (required_error) {
                return required_error;
            }

            var value_and_type = FieldVal.get_value_and_type(value, desired_type, options);

            var inner_desired_type = value_and_type.desired_type;
            var type = value_and_type.type;
            value = value_and_type.value;

            if (type !== inner_desired_type) {
                return FieldVal.create_error(FieldVal.INCORRECT_TYPE_ERROR, options, inner_desired_type, type);
            }
            if (emit) {
                emit(value);
            }
        };

        return FieldVal.merge_options_and_checks(options,check);
    };

    FieldVal.create_error = function (default_error, options) {
        if (!options) {
            return default_error.apply(null, Array.prototype.slice.call(arguments, 2));
        }
        if (default_error === FieldVal.MISSING_ERROR) {
            var missing_error_type = typeof options.missing_error;

            /* istanbul ignore else */
            if (missing_error_type === 'function') {
                return options.missing_error.apply(null, Array.prototype.slice.call(arguments, 2));
            } else if (missing_error_type === 'object') {
                return options.missing_error;
            } else if (missing_error_type === 'string') {
                return {
                    error_message: options.missing_error
                };
            }
        } else {
            var error_type = typeof options.error;

            /* istanbul ignore else */
            if (error_type === 'function') {
                return options.error.apply(null, Array.prototype.slice.call(arguments, 2));
            } else if (error_type === 'object') {
                return options.error;
            } else if (error_type === 'string') {
                return {
                    error_message: options.error
                };
            }
        }

        return default_error.apply(null, Array.prototype.slice.call(arguments, 2));
    };
    // jshint ignore:start
    var DateVal = (function(){
    "use strict";

    var DateVal = {
    	errors: {
            invalid_date_format: function(format) {
                return {
                    error: 111,
                    error_message: "Invalid date format.",
                    format: format
                };
            },
            invalid_date: function() {
                return {
                    error: 112,
                    error_message: "Invalid date."
                };
            },
            invalid_date_format_string: function(){
                return {
                    error: 114,
                    error_message: "Invalid date format string."
                };
            },
            invalid_date_format_array: function(){
                return {
                    error: 121,
                    error_message: "Invalid date format array."
                };
            }
        },
        date_format_array: function(options) {
            options = options || {};

            var check = function(format, emit) {
                for(var i = 0; i < format.length; i++){
                    if (DateVal.date_components[format[i]] === undefined) {
                        return FieldVal.create_error(DateVal.errors.invalid_date_format_array, options);
                    }
                }
                emit(format);
            };
            if(options){
                options.check = check;
                return options;
            }
            return {
                check: check
            };
        },
    	date_format: function(options){

            options = options || {};

            var check = function(format, emit) {

                var format_array = [];

                var f = 0;
                var error = false;
                while(f < format.length && !error){
                    var handled = false;
                    for(var c in DateVal.date_components){
                        var substring = format.substring(f,f+c.length);
                        if(substring===c){
                            format_array.push(c);
                            f += c.length;
                            handled = true;
                            break;
                        }
                    }
                    if(!handled){
                        return FieldVal.create_error(DateVal.errors.invalid_date_format_string, options);
                    }
                }
                    
                if (options.emit == DateVal.EMIT_STRING) {
                    emit(format);
                } else {
                    emit(format_array);
                }
            };
            if(options){
                options.check = check;
                return options;
            }
            return {
                check: check
            };
        },
        date_with_format_array: function(date, format_array){
            //Takes a Javascript Date object

            var date_format_err = FieldVal.use_checks(format_array, [
                BasicVal.array(true),
                BasicVal.each(function(value, index, emit){
                    return BasicVal.string(true, {trim: false}).check(value);
                }),
                DateVal.date_format_array()
            ]);

            if (date_format_err !== null) {
                throw new Error('Not a valid date format: ' + JSON.stringify(date_format_err));
            }

            var date_string = "";

            for(var i = 0; i < format_array.length; i++){
                var component = format_array[i];
                var component_value = DateVal.date_components[component];
                if(component_value===0){
                    date_string+=component;
                } else {
                    var value_in_date;
                    if(component==='yyyy'){
                        value_in_date = date.getUTCFullYear();
                    } else if(component==='yy'){
                        value_in_date = date.getUTCFullYear().toString().substring(2);
                    } else if(component==='MM' || component==='M'){
                        value_in_date = date.getUTCMonth()+1;
                    } else if(component==='dd' || component==='d'){
                        value_in_date = date.getUTCDate();
                    } else if(component==='hh' || component==='h'){
                        value_in_date = date.getUTCHours();
                    } else if(component==='mm' || component==='m'){
                        value_in_date = date.getUTCMinutes();
                    } else if(component==='ss' || component==='s'){
                        value_in_date = date.getUTCSeconds();
                    }

                    date_string += DateVal.pad_to_valid(value_in_date.toString(), component_value);
                }
            }

            return date_string;
        },
        pad_to_valid: function(value, allowed){
            var numeric_value;
            var error = BasicVal.integer({parse:true}).check(value,function(parsed){
                numeric_value = parsed;
            });
            if (error || numeric_value<0) {
                return value;
            }
            
            for(var k = 0; k < allowed.length; k++){
                var allowed_length = allowed[k];

                if(value.length <= allowed_length){
                    var diff = allowed_length - value.length;
                    for(var m = 0; m < diff; m++){
                        value = "0"+value;
                    }
                    return value;
                }
            }
            return value;
        },
    	date: function(format, options){

    		options = options || {};

            var format_array;

            var format_error = DateVal.date_format().check(format, function(emit_format_array){
                format_array = emit_format_array;
            });
            
            if(format_error){
                if(console.error){
                    console.error(format_error.error_message);
                }
            }

            var check = function(value, emit) {
                var values = {};
                var value_array = [];

                var i = 0;
                var current_component = null;
                var current_component_value = null;
                var component_index = -1;
                var error = false;
                while(i < value.length && !error){
                    component_index++;
                    current_component = format_array[component_index];
                    current_component_value = DateVal.date_components[current_component];

                    if(current_component_value===0){
                        //Expecting a particular delimiter
                        if(value[i]!==current_component){
                            error = true;
                            break;
                        } else {
                        	value_array.push(null);
                            i++;
                            continue;
                        }
                    }

                    var min = current_component_value[0];
                    var max = current_component_value[current_component_value.length-1];

                    var incremented = false;
                    var numeric_string = "";
                    for(var n = 0; n < max; n++){
                        var character = value[i + n];
                        if(character===undefined){
                            if(n<min){
                                error = true;
                            }
                            break;
                        }
                        var char_code = character.charCodeAt(0);
                        if(char_code < 48 || char_code > 57){
                            if(n===min){
                                //Stopped at min
                                break;
                            } else {
                                error = true;
                                break;
                            }
                        } else {
                            numeric_string+=character;
                        }
                    }
                    
                    i += n;

                    if(error){
                        break;
                    }

                    var int_val = parseInt(numeric_string);

                    value_array.push(numeric_string);

                    if(current_component==='yyyy' || current_component==='yy'){
                        values.year = int_val;
                    } else if(current_component==='MM' || current_component==='M'){
                        values.month = int_val;
                    } else if(current_component==='dd' || current_component==='d'){
                        values.day = int_val;
                    } else if(current_component==='hh' || current_component==='h'){
                        values.hour = int_val;
                    } else if(current_component==='mm' || current_component==='m'){
                        values.minute = int_val;
                    } else if(current_component==='ss' || current_component==='s'){
                        values.second = int_val;
                    }
                }

                if(error || component_index<format_array.length-1){
                    return FieldVal.create_error(DateVal.errors.invalid_date_format, options, format);
                }

                if(values.hour!==undefined && (values.hour < 0 || values.hour>23)){
                	return FieldVal.create_error(DateVal.errors.invalid_date, options);
                }
                if(values.minute!==undefined && (values.minute < 0 || values.minute>59)){
                	return FieldVal.create_error(DateVal.errors.invalid_date, options);
                }
                if(values.second!==undefined && (values.second < 0 || values.second>59)){
                	return FieldVal.create_error(DateVal.errors.invalid_date, options);
                }

                if(values.month!==undefined){
                    var month = values.month;
                    if(month>12){
                        return FieldVal.create_error(DateVal.errors.invalid_date, options);
                    } else if(month<1){
                        return FieldVal.create_error(DateVal.errors.invalid_date, options);
                    }

                    if(values.day){
                        var day = values.day;

                        if(day<1){
                            return FieldVal.create_error(DateVal.errors.invalid_date, options);
                        }

                        if(values.year){
                            var year = values.year;
                            if(month==2){
                                if(year%400===0 || (year%100!==0 && year%4===0)){
                                    if(day>29){
                                        return FieldVal.create_error(DateVal.errors.invalid_date, options);
                                    }
                                } else {
                                    if(day>28){
                                        return FieldVal.create_error(DateVal.errors.invalid_date, options);
                                    }
                                }
                            }
                        }
        
                        if(month===4 || month===6 || month===9 || month===11){
                            if(day > 30){
                                return FieldVal.create_error(DateVal.errors.invalid_date, options);
                            }
                        } else if(month===2){
                            if(day > 29){
                                return FieldVal.create_error(DateVal.errors.invalid_date, options);
                            }
                        } else {
                            if(day > 31){
                                return FieldVal.create_error(DateVal.errors.invalid_date, options);
                            }
                        }
                    }
                } else {
                    //Don't have month, but days shouldn't be greater than 31 anyway
                    if(values.day){
                        if(values.day > 31){
                            return FieldVal.create_error(DateVal.errors.invalid_date, options);
                        } else if(values.day < 1){
                            return FieldVal.create_error(DateVal.errors.invalid_date, options);
                        }
                    }
                }

                if(options.emit){
                	if(options.emit === DateVal.EMIT_COMPONENT_ARRAY){
                		emit(value_array);
                	} else if(options.emit === DateVal.EMIT_OBJECT){
                        emit(values);
                    } else if(options.emit === DateVal.EMIT_DATE){
                        var date = new Date(0);//Start with Jan 1st 1970
                        date.setUTCFullYear(0);

                        if(values.year!==undefined){
                            date.setYear(values.year);
                        }
                        if(values.month!==undefined){
                            date.setUTCMonth(values.month-1);
                        }
                        if(values.day!==undefined){
                            date.setUTCDate(values.day);
                        }
                        if(values.hour!==undefined){
                            date.setUTCHours(values.hour);
                        }
                        if(values.minute!==undefined){
                            date.setUTCMinutes(values.minute);
                        }
                        if(values.second!==undefined){
                            date.setUTCSeconds(values.second);
                        }

                        emit(date);
                    }
                }

                //SUCCESS
                return;
            };
            if(options){
                options.check = check;
                return options;
            }
            return {
                check: check
            };
        }
    };

    //Constants used for emit settings
    DateVal.EMIT_COMPONENT_ARRAY = {};
    DateVal.EMIT_DATE = {};
    DateVal.EMIT_OBJECT = {};
    DateVal.EMIT_STRING = {};

    DateVal.date_components = {
        "yyyy": [4],
        "yy": [2],
        "MM": [2],
        "M": [1,2],
        "dd": [2],
        "d": [1,2],
        "hh": [2],
        "h": [1,2],
        "mm": [2],
        "m": [1,2],
        "ss": [2],
        "s": [1,2],
        " ": 0,
        "-": 0,
        "/": 0,
        ":": 0
    };

    return DateVal;
}).call();
    var BasicVal = (function(){

    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function(searchElement, fromIndex) {
            var k;
            if (this === null) {
                throw new TypeError('"this" is null or not defined');
            }

            var O = Object(this);
            var len = O.length >>> 0;
            if (len === 0) {
                return -1;
            }
            var n = +fromIndex || 0;
            if (Math.abs(n) === Infinity) {
                n = 0;
            }
            if (n >= len) {
                return -1;
            }
            k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
            while (k < len) {
                var kValue;
                if (k in O && O[k] === searchElement) {
                    return k;
                }
                k++;
            }
            return -1;
        };
    }

    var BasicVal = {
        errors: {
            too_short: function(min_len) {
                return {
                    error: 100,
                    error_message: "Length is less than " + min_len,
                    min_length: min_len
                };
            },
            too_long: function(max_len) {
                return {
                    error: 101,
                    error_message: "Length is greater than " + max_len,
                    max_length: max_len
                };
            },
            too_small: function(min_val) {
                return {
                    error: 102,
                    error_message: "Value is less than " + min_val,
                    minimum: min_val
                };
            },
            too_large: function(max_val) {
                return {
                    error: 103,
                    error_message: "Value is greater than " + max_val,
                    maximum: max_val
                };
            },
            not_in_list: function() {
                return {
                    error: 104,
                    error_message: "Value is not a valid choice"
                };
            },
            cannot_be_empty: function() {
                return {
                    error: 105,
                    error_message: "Value cannot be empty."
                };
            },
            no_prefix: function(prefix) {
                return {
                    error: 106,
                    error_message: "Value does not have prefix: " + prefix,
                    prefix: prefix
                };
            },
            invalid_email: function() {
                return {
                    error: 107,
                    error_message: "Invalid email address format."
                };
            },
            invalid_url: function() {
                return {
                    error: 108,
                    error_message: "Invalid url format."
                };
            },
            incorrect_length: function(len){
                return {
                    error: 109,
                    error_message: "Length is not equal to " + len,
                    length: len
                };
            },
            no_suffix: function(suffix) {
                return {
                    error: 110,
                    error_message: "Value does not have suffix: " + suffix,
                    suffix: suffix
                };
            },
            //111 in DateVal
            //112 in DateVal
            not_equal: function(match){
                return {
                    error: 113,
                    error_message: "Not equal to " + match + ".",
                    equal: match
                };
            },
            //114 in DateVal
            no_valid_option: function(){//Should be overriden in most cases
                return {
                    error: 115,
                    error_message: "None of the options were valid.",
                };
            },
            contains_whitespace: function(){
                return {
                    error: 116,
                    error_message: "Contains whitespace."
                };
            },
            must_start_with_letter: function(){
                return {
                    error: 117,
                    error_message: "Must start with a letter."
                };  
            },
            value_in_list: function() {
                return {
                    error: 118,
                    error_message: "Value not allowed"
                };
            },
            should_not_contain: function(characters) {
                var disallowed = characters.join(",");
                return {
                    error: 119,
                    error_message: "Cannot contain "+disallowed,
                    cannot_contain: characters
                };
            },
            invalid_domain: function() {
                return {
                    error: 120,
                    error_message: "Invalid domain format."
                };
            }
        },
        equal_to: function(match, options){
            var check = function(value) {
                if (value!==match) {
                    return FieldVal.create_error(BasicVal.errors.not_equal, options, match);
                }
            };
            if(options){
                options.check = check;
                return options;
            }
            return {
                check: check
            };
        },
        merge_required_and_options: function(required, options){
            var new_options = {};
            if((typeof required)==="object"){
                options = required;
                required = undefined;
            } else {
                if(!options){
                    options = {};
                }
            }
            for(var i in options){
                if(options.hasOwnProperty(i)){
                    new_options[i] = options[i];
                }
            }
            if(required!==undefined){
                new_options.required = required;
            }
            return new_options;
        },
        integer: function(required, options){
            return FieldVal.type("integer",BasicVal.merge_required_and_options(required, options));
        },
        number: function(required, options){
            return FieldVal.type("number",BasicVal.merge_required_and_options(required, options));
        },
        array: function(required, options){
            return FieldVal.type("array",BasicVal.merge_required_and_options(required, options));
        },
        object: function(required, options){
            return FieldVal.type("object",BasicVal.merge_required_and_options(required, options));
        },
        boolean: function(required, options){
            return FieldVal.type("boolean",BasicVal.merge_required_and_options(required, options));
        },
        string: function(required, options){
            options = BasicVal.merge_required_and_options(required, options);
            var check = function(value, emit) {

                var core_check = FieldVal.type("string",options);
                if(typeof core_check === 'object'){
                    //Passing options turns the check into an object
                    core_check = core_check.check;
                }

                //Passing emit means that the value can be changed
                var error = core_check(value,emit);
                if(error) return error;

                if(!options || options.trim!==false){//If not explicitly false
                    value = value.trim();
                }
                if (value.length === 0) {
                    if(required || required===undefined){
                        return FieldVal.create_error(FieldVal.MISSING_ERROR, options);
                    } else {
                        return FieldVal.NOT_REQUIRED_BUT_MISSING;
                    }
                }
            };
            if(options){
                options.check = check;
                return options;
            }
            return {
                check: check
            };
        },
        length: function(len, options) {
            var check = function(value) {
                if (value.length!==len) {
                    return FieldVal.create_error(BasicVal.errors.incorrect_length, options, len);
                }
            };
            if(options){
                options.check = check;
                return options;
            }
            return {
                check: check
            };
        },
        min_length: function(min_len, options) {
            var check = function(value) {
                if (value.length < min_len) {
                    return FieldVal.create_error(BasicVal.errors.too_short, options, min_len);
                }
            };
            if(options){
                options.check = check;
                return options;
            }
            return {
                check: check
            };
        },
        max_length: function(max_len, options) {
            var check = function(value) {
                if (value.length > max_len) {
                    return FieldVal.create_error(BasicVal.errors.too_long, options, max_len);
                }
            };
            if(options){
                options.check = check;
                return options;
            }
            return {
                check: check
            };
        },
        no_whitespace: function(options) {
            var check = function(value) {
                if (/\s/.test(value)){
                    return FieldVal.create_error(BasicVal.errors.contains_whitespace, options);
                }
            };
            if(options){
                options.check = check;
                return options;
            }
            return {
                check: check
            };
        },
        minimum: function(min_val, options) {
            var check = function(value) {
                if (value < min_val) {
                    return FieldVal.create_error(BasicVal.errors.too_small, options, min_val);
                }
            };
            if(options){
                options.check = check;
                return options;
            }
            return {
                check: check
            };
        },
        maximum: function(max_val, options) {
            var check = function(value) {
                if (value > max_val) {
                    return FieldVal.create_error(BasicVal.errors.too_large, options, max_val);
                }
            };
            if(options){
                options.check = check;
                return options;
            }
            return {
                check: check
            };
        },
        range: function(min_val, max_val, options) {
            //Effectively combines minimum and maximum
            var check = function(value){
                if (value < min_val) {
                    return FieldVal.create_error(BasicVal.errors.too_small, options, min_val);
                } else if (value > max_val) {
                    return FieldVal.create_error(BasicVal.errors.too_large, options, max_val);
                }
            };
            if(options){
                options.check = check;
                return options;
            }
            return {
                check: check
            };
        },
        does_not_contain: function(characters, options){
            if(!Array.isArray(characters)){
                characters = [characters];
            }
            var check = function(value) {
                for(var i = 0; i < characters.length; i++){
                    if(value.indexOf(characters[i])!==-1){
                        return FieldVal.create_error(BasicVal.errors.should_not_contain, options, characters);
                    }
                }
            };
            if(options){
                options.check = check;
                return options;
            }
            return {
                check: check
            };
        },
        one_of: function(array, options) {
            var valid_values = [];
            if(Array.isArray(array)){
                for(var i = 0; i < array.length; i++){
                    var option = array[i];
                    if(option!==null && (typeof option) === 'object'){
                        valid_values.push(option[0]);
                    } else {
                        valid_values.push(option);
                    }
                }
            } else {
                for(var k in array){
                    if(array.hasOwnProperty(k)){
                        valid_values.push(k);
                    }
                }
            }
            var check = function(value) {
                if (valid_values.indexOf(value) === -1) {
                    return FieldVal.create_error(BasicVal.errors.not_in_list, options);
                }
            };
            if(options){
                options.check = check;
                return options;
            }
            return {
                check: check
            };
        },
        not_one_of: function(array, options) {
            var valid_values = [];
            if(Object.prototype.toString.call(array) === '[object Array]'){
                for(var i = 0; i < array.length; i++){
                    var option = array[i];
                    if((typeof option) === 'object'){
                        valid_values.push(option[0]);
                    } else {
                        valid_values.push(option);
                    }
                }
            } else {
                for(var k in array){
                    if(array.hasOwnProperty(k)){
                        valid_values.push(k);
                    }
                }
            }
            var check = function(value) {
                if (valid_values.indexOf(value) !== -1) {
                    return FieldVal.create_error(BasicVal.errors.value_in_list, options);
                }
            };
            if(options){
                options.check = check;
                return options;
            }
            return {
                check: check
            };
        },
        not_empty: function(trim, options) {
            var check = function(value) {
                if (trim) {
                    if (value.trim().length === 0) {
                        if(typeof options.error){
                        }
                        return FieldVal.create_error(BasicVal.errors.cannot_be_empty, options);
                    }
                } else {
                    if (value.length === 0) {
                        return FieldVal.create_error(BasicVal.errors.cannot_be_empty, options);
                    }
                }
            };
            if(options){
                options.check = check;
                return options;
            }
            return {
                check: check
            };
        },
        prefix: function(prefix, options) {
            var check = function(value) {
                if (value.length >= prefix.length) {
                    if (value.substring(0, prefix.length) != prefix) {
                        return FieldVal.create_error(BasicVal.errors.no_prefix, options, prefix);
                    }
                } else {
                    return FieldVal.create_error(BasicVal.errors.no_prefix, options, prefix);
                }
            };
            if(options){
                options.check = check;
                return options;
            }
            return {
                check: check
            };
        },
        start_with_letter: function(options) {
            var check = function(value) {
                if (value.length > 0) {
                    var char_code = value.charCodeAt(0);
                    if( !((char_code >= 65 && char_code <= 90) || (char_code >= 97 && char_code <= 122))){
                        return FieldVal.create_error(BasicVal.errors.must_start_with_letter, options);
                    }
                } else {
                    return FieldVal.create_error(BasicVal.errors.must_start_with_letter, options);
                }
            };
            if(options){
                options.check = check;
                return options;
            }
            return {
                check: check
            };
        },
        suffix: function(suffix, options) {
            var check = function(value) {
                if (value.length >= suffix.length) {
                    if (value.substring(value.length-suffix.length, value.length) != suffix) {
                        return FieldVal.create_error(BasicVal.errors.no_suffix, options, suffix);
                    }
                } else {
                    return FieldVal.create_error(BasicVal.errors.no_suffix, options, suffix);
                }
            };
            if(options){
                options.check = check;
                return options;
            }
            return {
                check: check
            };
        },
        date: DateVal.date,
        date_format: DateVal.date_format,
        date_format_array: DateVal.date_format_array,
        each: function(on_each, options) {
            var check = function(array, stop) {
                var validator = new FieldVal(null);
                var iterator = function(i){
                    var value = array[i];

                    var res = on_each(value,i,function(emitted_value){
                        array[i] = emitted_value;
                    });
                    if(res===FieldVal.ASYNC){
                        throw new Error(".each used with async checks, use .each_async.");
                    }
                    if (res) {
                        validator.invalid("" + i, res);
                    }
                };
                if(Array.isArray(array)){
                    for (var i = 0; i < array.length; i++) {
                        iterator(i);
                    }
                } else {
                    for (var k in array) {
                        if(array.hasOwnProperty(k)){
                            iterator(k);
                        }
                    }
                }
                var error = validator.end();
                if(error){
                    return error;
                }
            };
            if(options){
                options.check = check;
                return options;
            }
            return {
                check: check
            };
        },
        each_async: function(on_each, options) {
            var check = function(array, emit, callback) {

                var is_array = Array.isArray(array);
                var keys;
                if(!is_array){
                    keys = Object.keys(array);
                }
                
                var validator = new FieldVal(null);
                var idx = 0;
                var i,value;
                if(is_array){
                    i = idx;
                }
                var do_possible = function(){
                    if(is_array){
                        i++;
                        if(i>array.length){
                            callback(validator.end());
                            return;
                        }
                        value = array[i-1];
                    } else {
                        idx++;
                        if(idx>keys.length){
                            callback(validator.end());
                            return;
                        }
                        i = keys[idx-1];
                        value = array[i];
                    }

                    FieldVal.use_checks(value, [function(value, emit, next){
                        on_each(value,i,emit,next);
                    }], {
                        field_name: is_array ? (""+(i-1)) : i,
                        validator: validator,
                        emit: function(emitted_value){
                            if(is_array){
                                array[i-1] = emitted_value;
                            } else {
                                array[i] = emitted_value;
                            }
                        }
                    }, function(response){
                        do_possible();
                    });
                };
                do_possible();
            };
            if(options){
                options.check = check;
                return options;
            }
            return {
                check: check
            };
        },
        multiple: function(possibles, options){

            possibles = possibles || [];
            if(possibles.length===0){
                console.error("BasicVal.multiple called without possibles.");
            }
            
            var check = function(value, emit){
                for(var i = 0; i < possibles.length; i++){
                    var array_of_checks = possibles[i];
            
                    var emitted_value;
                    var option_error = FieldVal.use_checks(value, array_of_checks, {
                        emit: function(emitted){// jshint ignore:line
                            emitted_value = emitted;
                        }
                    });
                    
                    if(option_error===FieldVal.ASYNC){
                        throw new Error(".multiple used with async checks, use .multiple_async.");
                    }
                    if(!option_error){
                        if(emitted_value!==undefined){
                            emit(emitted_value);
                        }
                        return null;
                    }
                }
                return FieldVal.create_error(BasicVal.errors.no_valid_option, options);
            };
            if(options){
                options.check = check;
                return options;
            }
            return {
                check: check
            };
        },
        multiple_async: function(possibles, options){

            possibles = possibles || [];
            if(possibles.length===0){
                console.error("BasicVal.multiple_async called without possibles.");
                return;
            }

            var to_return;
            var check = function(value, emit, callback){
                var emitted_value;
                var emit_for_check = function(emitted){
                    emitted_value = emitted;
                };
                var i = 0;
                var do_possible = function(){
                    i++;
                    if(i>possibles.length){
                        callback(FieldVal.create_error(BasicVal.errors.no_valid_option, options));
                        return;
                    }
                    var option = possibles[i-1];

                    FieldVal.use_checks(value, option, {
                        field_name: null,
                        validator: null,
                        emit: emit_for_check
                    }, function(response){
                        if(!response){
                            callback(undefined);//Success
                        } else {
                            do_possible();
                        }
                    });
                };
                do_possible();
                return to_return;
            };
            if(options){
                options.check = check;
                return options;
            }
            return {
                check: check
            };
        },
        email: function(required, options){
            options = BasicVal.merge_required_and_options(required, options);
            var check = function(value) {
                var string_error = BasicVal.string(options).check(value);
                if(string_error!==undefined) return string_error;

                var re = BasicVal.email_regex;
                if(!re.test(value)){
                    return FieldVal.create_error(BasicVal.errors.invalid_email, options);
                } 
            };
            if(options){
                options.check = check;
                return options;
            }
            return {
                check: check
            };
        },
        url: function(required, options){
            options = BasicVal.merge_required_and_options(required, options);
            var check = function(value) {
                var string_error = BasicVal.string(options).check(value);
                if(string_error!==undefined) return string_error;
                
                var re = BasicVal.url_regex;
                if(!re.test(value)){
                    return FieldVal.create_error(BasicVal.errors.invalid_url, options);
                } 
            };
            if(options){
                options.check = check;
                return options;
            }
            return {
                check: check
            };
        },
        domain: function(required, options){
            options = BasicVal.merge_required_and_options(required, options);
            var check = function(value) {
                var string_error = BasicVal.string(options).check(value);
                if(string_error!==undefined) return string_error;
                
                var re = BasicVal.domain_regex;
                if(!re.test(value)){
                    return FieldVal.create_error(BasicVal.errors.invalid_domain, options);
                } 
            };
            if(options){
                options.check = check;
                return options;
            }
            return {
                check: check
            };
        },
        required: FieldVal.required
    };

    BasicVal.email_regex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    BasicVal.url_regex = /^(https?):\/\/(((([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))|((([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])))(:[1-9][0-9]+)?(\/)?([\/?].+)?$/;
    BasicVal.domain_regex = /^(https?):\/\/(((([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))|((([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])))(:[1-9][0-9]+)?(\/)?$/;

    return BasicVal;
}).call();
    // jshint ignore:end
    
    FieldVal.DateVal = DateVal;
    FieldVal.BasicVal = BasicVal;

    return FieldVal;
}).call();

/* istanbul ignore else */
if ('undefined' !== typeof module) {
    module.exports = FieldVal;
} else {
    //Expose BasicVal and DateVal globally
    BasicVal = FieldVal.BasicVal;
    DateVal = FieldVal.DateVal;
}