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
                    error: 104,
                    error_message: "Value not allowed"
                };
            },
            should_not_contain: function(characters) {
                var disallowed = characters.join(",");
                return {
                    error: 105,
                    error_message: "Cannot contain "+disallowed,
                    cannot_contain: characters
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
                    var option = possibles[i];
            
                    var emitted_value;
                    var option_error = FieldVal.use_checks(value, option, null, null, function(emitted){
                        emitted_value = emitted;
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
        required: FieldVal.required
    };

    BasicVal.email_regex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    BasicVal.url_regex = /^(https?):\/\/(((([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))|((([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])))(:[1-9][0-9]+)?(\/)?([\/?].+)?$/;

    return BasicVal;
}).call();