var logger = require("tracer").console();
var FieldVal = require('../src/FieldVal');
var bval = require('fieldval-basicval');
var assert = require("assert")

describe('FieldVal', function() {
    describe('constructor', function() {
        it('should return an object if constructed with an empty object', function() {
            assert.equal("object", typeof new FieldVal({}));
        })
    })
    describe('constructor', function() {
        it('should return an object if constructed with a null parameter', function() {
            assert.equal("object", typeof new FieldVal(null));
        })
    })
    describe('get()', function() {
        it('should return the value when the value is present', function() {
            var validator = new FieldVal({
                "my_value": 13
            })
            assert.equal(13, validator.get("my_value"));
        })

        it('should throw an error if used with async checks', function(done) {
            var validator = new FieldVal({
                "my_value": 13
            })
            try{
                var async_check = function(value, emit, callback) {
                    assert.equal(13, value);
                    setTimeout(function(){
                        callback({
                            "error_message": "This is a custom error",
                            "error": 1000
                        })
                    },30);
                }

                assert.equal(13, validator.get("my_value", async_check));
            } catch (e){
                //Expecting an error
                assert.equal(e.message, ".get used with async checks, use .get_async.")
                done();
            }
        })

        it('should throw an error if used with async checks, even if the callback is immediate', function(done) {
            var validator = new FieldVal({
                "my_value": 13
            })
            try{
                var async_check = function(value, emit, callback) {
                    assert.equal(13, value);
                    callback({
                        "error_message": "This is a custom error",
                        "error": 1000
                    })
                }

                assert.equal(13, validator.get("my_value", async_check));
            } catch (e){
                //Expecting an error
                assert.equal(e.message, ".get used with async checks, use .get_async.")
                done();
            }
        })

        it('should be able to continue from a previous validator', function(done) {
            var my_data = {
                "valid_one_key": 10,
                "my_invalid_key": 15,
                "my_unrecognized_key": 13,
            };
            var validator_one = new FieldVal(my_data);

            validator_one.get("valid_one_key", bval.integer(true));
            validator_one.get("my_invalid_key", bval.integer(true), bval.minimum(20));
            validator_one.get("my_missing_key", bval.integer(true));

            validator_one.end(function(error_one, recognized_keys){

                var validator_two = new FieldVal(my_data, error_one, recognized_keys);
                validator_two.get("valid_one_key", bval.integer(true), bval.minimum(20))//Makes this key invalid on validator_two

                var error_two = validator_two.end();

                assert.deepEqual(error_two, { 
                    missing: { 
                        my_missing_key: { 
                            error_message: 'Field missing.', error: 1 
                        }
                    },
                    invalid: { 
                        my_invalid_key: { 
                            error: 102, error_message: 'Value is less than 20' 
                        },
                        valid_one_key: { 
                            error: 102, error_message: 'Value is less than 20' 
                        }
                    },
                    unrecognized: { 
                        my_unrecognized_key: { 
                            error_message: 'Unrecognized field.', error: 3 
                        }
                    },
                    error_message: 'One or more errors.',
                    error: 0 
                });

                done();
            });
        })

        it('', function(done) {
            var validator = new FieldVal({
                "my_value": 13
            })
            try{
                var async_check = function(value, emit, callback){
                    assert.equal(13, value);
                    callback({
                        "error_message": "This is a custom error",
                        "error": 1000
                    })
                }

                validator.get("my_value", async_check);
            } catch (e){
                assert.equal(e.message, ".get used with async checks, use .get_async.")
                done();
            }
        })
    })
    describe('get_async', function() {
        it('should return value when the value is present', function(done) {
            var validator = new FieldVal({
                "my_value": 13
            })
            var get_async_output = validator.get_async("my_value",[function(value, emit, callback){
                assert.equal(13, value);

                setTimeout(function(){
                    callback({
                        "error_message": "This is a custom error",
                        "error": 1000
                    })
                },30);

            }], function(value){

                validator.end(function(result){
                    assert.deepEqual({
                        "invalid": {
                            "my_value" :{
                                "error": 1000,
                                "error_message":"This is a custom error"
                            }
                        },
                        "error_message":"One or more errors.",
                        "error": 0
                    }, result);
                    done();
                })
            })

            assert.equal(get_async_output, FieldVal.ASYNC);
        })
    })
    describe('get_value_and_type()', function() {
        it('should return type and value info 1', function() {
            var vt = FieldVal.get_value_and_type('One','string');
            assert.deepEqual({
                type: 'string',
                desired_type: 'string',
                value: 'One'
            }, vt);
            assert.strictEqual('One', vt.value);
        })
        it('should return type and value info (numeric string', function() {
            var vt = FieldVal.get_value_and_type('2','number',{parse:true});
            assert.deepEqual({
                type: 'number',
                desired_type: 'number',
                value: 2
            }, vt);
            assert.strictEqual(2, vt.value);
        })
        it('should return type and value info (numeric string', function() {
            var vt = FieldVal.get_value_and_type('2.a','float',{parse:true});
            assert.deepEqual({
                type: 'string',
                desired_type: 'float',
                value: '2.a'
            }, vt);
            assert.strictEqual('2.a', vt.value);
        })
        it('should return type and value info string->integer', function() {
            var vt = FieldVal.get_value_and_type('3','integer',{parse:true});
            assert.deepEqual({
                type: 'number',
                desired_type: 'number',
                value: 3
            }, vt);
            assert.strictEqual(3, vt.value);
        })
        it('should return type and value info string->integer', function() {
            var vt = FieldVal.get_value_and_type('4b','integer',{parse:true});
            assert.deepEqual({
                type: 'string',
                desired_type: 'integer',
                value: '4b'
            }, vt);
            assert.strictEqual('4b', vt.value);
        })
        it('should return type and value info (array)', function() {
            var vt = FieldVal.get_value_and_type([1,2,3],'array');
            assert.deepEqual({
                type: 'array',
                desired_type: 'array',
                value: [1,2,3]
            }, vt);
        })
        it('should return type and value info (array)', function() {
            var vt = FieldVal.get_value_and_type({
                    "one":1,
                    "two":2,
                    "three":3
                },'array'
            );

            assert.deepEqual({
                type: 'object',
                desired_type: 'array',
                value: {
                    "one":1,
                    "two":2,
                    "three":3
                }
            }, vt);
        })
    })
    describe('use_checks()', function() {
        it('should return undefined if there are no checks', function() {
            var output = FieldVal.use_checks(23);
            assert.equal(undefined, output);
        })

        it('should throw an error if the checks are provided incorrectly', function(done) {
            var did_throw_error = false;
            try{
                var output = FieldVal.use_checks(23, "NOT A VALID CHECK");
            } catch (e){
                assert.equal(e.message, "A check can only be provided as a function or as an object with a function as the .check property.")
                did_throw_error = true;
            }
            assert.equal(true, did_throw_error);
            done();
        })

        it('should return an error if any of the checks throw one (without validator)', function() {
            var output = FieldVal.use_checks(27, [
                bval.integer(true),
                bval.minimum(30)
            ]);
            assert.deepEqual({
                "error":102,
                "error_message":"Value is less than 30"
            }, output);
        })

        it('should use the emit function if one is provided', function() {
            var called_emit = false;
            var output = FieldVal.use_checks('17', [
                bval.integer(true, {parse: true})
            ],{
                emit: function(new_value){
                    assert.strictEqual(17, new_value);
                    called_emit = true;
                }
            });
            assert.equal(true, called_emit);
        })

        it('should return a missing error (FieldVal.REQUIRED_ERROR) (without validator)', function() {
            var output = FieldVal.use_checks(undefined, [
                bval.string(true)
            ]);
            assert.deepEqual(FieldVal.REQUIRED_ERROR, output);
        })

        it('should allow omitting the options argument', function() {
            var did_respond = false;
            var output = FieldVal.use_checks("my_value", [
                bval.integer(true)
            ], function(response){
                did_respond = true;
                assert.deepEqual({
                    "error_message":"Incorrect field type. Expected integer.",
                    "error":2,
                    "expected":"integer",
                    "received":"string"
                }, response);
            });

            assert.equal(did_respond, true);
        })

        it('should return undefined if required false and value is undefined', function() {
            var output = FieldVal.use_checks(undefined, [
                bval.string(false),
            ]);
            assert.deepEqual(undefined, output);
        })

        it('should return a missing error (FieldVal.REQUIRED_ERROR) (with validator, without field name)', function() {
            var validator = new FieldVal();
            var output = FieldVal.use_checks(undefined, [
                bval.string(true)
            ],{
                validator: validator
            });
            assert.deepEqual(undefined, output);
            assert.deepEqual({
                "error":1,
                "error_message":"Field missing."
            },validator.end())
        })

        it('should return an error if any of the checks throw one (with validator, without field name)', function() {
            var validator = new FieldVal();

            var did_respond = false;
            
            var output = FieldVal.use_checks(
                27,//value
                [//checks
                    bval.integer(true),
                    bval.minimum(30)
                ],
                {//options
                    validator: validator
                },
                function(response){//callback
                    assert.deepEqual(undefined, response);
                    did_respond = true;
                }
            );

            assert.equal(did_respond, true);
            assert.deepEqual(undefined, output);
            assert.deepEqual({
                "error":102,
                "error_message":"Value is less than 30"
            },validator.end())
        })

        it('should return an error if any of the checks throw one (with validator, with field name)', function() {
            var validator = new FieldVal();
            var did_respond = false;
            var output = FieldVal.use_checks(
                27,//value
                [//checks
                    bval.integer(true),
                    bval.minimum(30)
                ],
                {//options
                    validator: validator,
                    field_name: "my_field_name"
                },
                function(response){//callback
                    assert.deepEqual(undefined, response);
                    did_respond = true;
                }
            );

            assert.equal(did_respond, true);
            assert.deepEqual(undefined, output);
            assert.deepEqual({
                "invalid": {
                    "my_field_name" :{
                        "error":102,
                        "error_message":"Value is less than 30"
                    }
                },
                "error_message":"One or more errors.",
                "error": 0
            },validator.end())
        })

        it('should return an error if any of the checks throw one (with validator, with field name, async)', function(done) {
            var validator = new FieldVal();

            var did_respond = false;

            var output = FieldVal.use_checks(
                27,//value
                [//checks
                    bval.integer(true),
                    bval.minimum(10),
                    function(value, emit, callback){
                        setTimeout(function(){
                            callback({
                                "error_message": "Custom error",
                                "error": 1000
                            })
                        },30);
                    },
                    bval.minimum(30)
                ],
                {//options
                    validator: validator,
                    field_name: "my_field_name",
                    emit: function(emitted){
                        assert.strictEqual(emitted,undefined);
                    },
                },
                function(response){//calback
                    assert.deepEqual(undefined, response);
                    did_respond = true;
                }
            );

            validator.end(function(response){

                assert.equal(did_respond, true);

                assert.deepEqual({
                    "invalid": {
                        "my_field_name" :{
                            "error":1000,
                            "error_message":"Custom error"
                        }
                    },
                    "error_message":"One or more errors.",
                    "error": 0
                }, response);

                done();
            })
        })

        it('should handle multiple async checks (with validator, with field names, async)', function(done) {
            var validator = new FieldVal();

            var did_respond = 0;

            FieldVal.use_checks(
                27,//value
                [//checks
                    bval.integer(true),
                    bval.minimum(10),
                    function(value, emit, callback){
                        setTimeout(function(){
                            callback({
                                "error_message": "Custom error one",
                                "error": 1000
                            })
                        },30);
                    },
                    bval.minimum(30)
                ],
                {//options
                    validator: validator,
                    field_name: "my_field_name_one",
                    emit: function(emitted){
                        assert.strictEqual(emitted,undefined);
                    },
                },
                function(response){//calback
                    assert.deepEqual(undefined, response);
                    did_respond++;
                }
            );

            FieldVal.use_checks(
                28,//value
                [//checks
                    bval.integer(true),
                    bval.minimum(10),
                    function(value, emit, callback){
                        setTimeout(function(){
                            callback({
                                "error_message": "Custom error two",
                                "error": 1001
                            })
                        },10);
                    },
                    bval.minimum(30)
                ],
                {//options
                    validator: validator,
                    field_name: "my_field_name_two",
                    emit: function(emitted){
                        assert.strictEqual(emitted,undefined);
                    },
                },
                function(response){//calback
                    assert.deepEqual(undefined, response);
                    did_respond++;
                }
            );

            validator.end(function(response){

                assert.equal(did_respond, 2);

                assert.deepEqual({
                    "invalid": {
                        "my_field_name_one" :{
                            "error":1000,
                            "error_message":"Custom error one"
                        },
                        "my_field_name_two" :{
                            "error":1001,
                            "error_message":"Custom error two"
                        }
                    },
                    "error_message":"One or more errors.",
                    "error": 0
                }, response);

                done();
            })
        })

        it('should allow omitting of the callback (with validator, with field name, async)', function(done) {
            var validator = new FieldVal();

            var output = FieldVal.use_checks(
                27,//value
                [//checks
                    bval.integer(true),
                    bval.minimum(10),
                    function(value, emit, callback){
                        setTimeout(function(){
                            callback({
                                "error_message": "Custom error",
                                "error": 1000
                            })
                        },30);
                    },
                    bval.minimum(30)
                ],
                {//options
                    validator: validator,
                    field_name: "my_field_name",
                    emit: function(emitted){
                        assert.strictEqual(emitted,undefined);
                    }
                }
            );

            validator.end(function(response){

                assert.deepEqual({
                    "invalid": {
                        "my_field_name" :{
                            "error":1000,
                            "error_message":"Custom error"
                        }
                    },
                    "error_message":"One or more errors.",
                    "error": 0
                }, response);

                done();
            })
        })

        it('should return a multiple error if multiple checks throw errors (with validator, with field name, async)', function(done) {
            var validator = new FieldVal();


            var did_respond = false;

            var output = FieldVal.use_checks(27, [
                bval.integer(true),
                bval.minimum(10),
                {
                    check: function(value, emit, callback){
                        setTimeout(function(){
                            callback({
                                "error_message": "Custom error",
                                "error": 1000
                            })
                        },30);
                    },
                    stop_on_error: false
                },
                bval.minimum(30)
            ],{
                validator: validator,
                field_name: "my_field_name",
                emit: function(emitted){
                    assert.strictEqual(emitted,undefined);
                }
            },function(response){
                assert.deepEqual(undefined, response);
                did_respond = true;
            });

            validator.end(function(response){

                assert.equal(did_respond, true);

                assert.deepEqual({
                    "invalid": {
                        "my_field_name" : {
                            "error":4,
                            "error_message":"Multiple errors.",
                            "errors":[{
                                "error":1000,
                                "error_message":"Custom error"
                            },
                            {
                                "error":102,
                                "error_message":"Value is less than 30"
                            }]
                        }
                    },
                    "error_message":"One or more errors.",
                    "error": 0
                }, response);

                done();
            })
        })

        it('should return a missing error (with validator, with field name)', function() {
            var validator = new FieldVal();
            var output = FieldVal.use_checks(undefined, [
                bval.integer(true)
            ],{
                validator: validator,
                field_name: "my_field_name"
            });

            assert.deepEqual(undefined, output);
            assert.deepEqual({
                "missing": {
                    "my_field_name" :{
                        "error":1,
                        "error_message":"Field missing."
                    }
                },
                "error_message":"One or more errors.",
                "error": 0
            },validator.end())
        })

        it('should return a missing error (without validator, with field name)', function() {
            var output = FieldVal.use_checks(undefined, [
                bval.integer(true)
            ],{
                field_name: "my_field_name"
            });

            assert.deepEqual({
                "missing": {
                    "my_field_name" :{
                        "error":1,
                        "error_message":"Field missing."
                    }
                },
                "error_message":"One or more errors.",
                "error": 0
            },output)
        })

        it('should return a missing error (without validator, with field name, async)', function() {
            var did_respond = false;
            var output = FieldVal.use_checks(undefined, [
                bval.integer(true)
            ],{
                field_name: "my_field_name"
            }, function(response){
                did_respond = true;
                assert.deepEqual(response, {
                    "missing": {
                        "my_field_name" :{
                            "error":1,
                            "error_message":"Field missing."
                        }
                    },
                    "error_message":"One or more errors.",
                    "error": 0
                })
            });

            assert.equal(did_respond, true);

            assert.deepEqual({
                "missing": {
                    "my_field_name" :{
                        "error":1,
                        "error_message":"Field missing."
                    }
                },
                "error_message":"One or more errors.",
                "error": 0
            },output)
        })


        it('should work with nested arrays of checks', function() {
            var output = FieldVal.use_checks(27, [
                bval.integer(true),
                [
                    bval.minimum(10),
                    bval.maximum(20)
                ]
            ]);
            assert.deepEqual({
                "error":103,
                "error_message":"Value is greater than 20"
            }, output);
        })

        it('stop_on_error should be respected, even in nested checks', function() {
            var output = FieldVal.use_checks(27, [
                bval.integer(true),
                [
                    bval.minimum(30, {stop_on_error: false}),
                    bval.maximum(20)
                ],
                bval.string(true)//Won't be run
            ]);
            assert.deepEqual({
                "error":4,
                "error_message":"Multiple errors.",
                "errors":[
                    {
                        "error":102,
                        "error_message":"Value is less than 30"
                    },{
                        "error":103,
                        "error_message":"Value is greater than 20"
                    }
                ]
            }, output);
        })
    })
    describe('custom missing errors', function(){
        it('should return the custom missing error if a required field is requested #1', function(){
            var validator = new FieldVal({});
            validator.get(
                'required_string',
                bval.string({
                    required:true, 
                    missing_error: {
                        error_message: "I'm a custom missing error!",
                        error: 1000
                    }
                })
            );

            var expected = {
                missing: {
                    'required_string': {
                        error_message: "I'm a custom missing error!",
                        error: 1000
                    }
                },
                error_message: 'One or more errors.',
                error: 0
            };
            var actual = validator.end();
            assert.deepEqual(expected, actual);
        })

        it('should return the custom missing error if a required field is requested #2', function(){
            var validator = new FieldVal({});
            validator.get(
                'required_string',
                bval.string(true, {
                    missing_error: {
                        error_message: "I'm a custom missing error!",
                        error: 1000
                    }
                })
            );

            var expected = {
                missing: {
                    'required_string': {
                        error_message: "I'm a custom missing error!",
                        error: 1000
                    }
                },
                error_message: 'One or more errors.',
                error: 0
            };
            var actual = validator.end();
            assert.deepEqual(expected, actual);
        })

        it('should return the custom missing error if a required field is requested #3', function(){
            var validator = new FieldVal({});
            validator.get(
                'required_integer',
                bval.integer(true, {
                    missing_error: function(){
                        return {
                            error_message: "I'm a custom missing error (for an integer), provided via a function!",
                            error: 1000
                        }
                    }
                })
            );

            var expected = {
                missing: {
                    'required_integer': {
                        error_message: "I'm a custom missing error (for an integer), provided via a function!",
                        error: 1000
                    }
                },
                error_message: 'One or more errors.',
                error: 0
            };
            var actual = validator.end();
            assert.deepEqual(expected, actual);
        })

         it('should return the custom missing error if a required field is requested #4', function(){
            var validator = new FieldVal({});
            validator.get(
                'required_integer',
                bval.integer(true, {
                    missing_error: "I'm a custom missing error (for an integer), provided as a string!"
                })
            );

            var expected = {
                missing: {
                    'required_integer': {
                        error_message: "I'm a custom missing error (for an integer), provided as a string!"
                        //No error code
                    }
                },
                error_message: 'One or more errors.',
                error: 0
            };
            var actual = validator.end();
            assert.deepEqual(expected, actual);
        })
    })
    describe('required()', function() {
        it('should return FieldVal.REQUIRED_ERROR if missing and required', function() {
            var output = FieldVal.required(true)(undefined);
            assert.strictEqual(FieldVal.REQUIRED_ERROR, output);
        })
        it('should return FieldVal.REQUIRED_ERROR if missing and required defaults to true', function() {
            var output = FieldVal.required()(undefined);
            assert.strictEqual(FieldVal.REQUIRED_ERROR, output);
        })
        it('should return FieldVal.NOT_REQUIRED_BUT_MISSING if missing, but not required', function() {
            var output = FieldVal.required(false)(undefined);
            assert.strictEqual(FieldVal.NOT_REQUIRED_BUT_MISSING, output);
        })
        it('should use flags', function() {
            var output = FieldVal.required(true,{}).check(undefined);
            assert.strictEqual(FieldVal.REQUIRED_ERROR, output);
        })
    })
    describe('type()', function() {
        it('should return an error for an invalid type', function() {
            var output = FieldVal.type('string')(15);
            assert.deepEqual({
                "error_message": "Incorrect field type. Expected string.",
                "error": 2,
                "expected": "string",
                "received": "number"
            }, output);
        })

        it('should return a custom error (object) for an invalid type', function() {
            var output = FieldVal.type('string',{
                error: {
                    "error": 1000,
                    "error_message": "Custom error message"
                }
            }).check(15);
            assert.deepEqual({
                "error": 1000,
                "error_message": "Custom error message"
            }, output);
        })

        it('should return a custom error (function) for an invalid type', function() {
            var output = FieldVal.type('string',{
                error: function(){
                    return {
                        "error": 1000,
                        "error_message": "Custom error message"
                    }
                }
            }).check(15);
            assert.deepEqual({
                "error": 1000,
                "error_message": "Custom error message"
            }, output);
        })

        it('should return a custom error (string) for an invalid type', function() {
            var output = FieldVal.type('string',{
                error: "Custom error message"
            }).check(15);
            assert.deepEqual({
                "error_message": "Custom error message"
            }, output);
        })

        it('should a required error for an undefined value', function() {
            var output = FieldVal.type('string',{required:true}).check(undefined);
            assert.deepEqual(FieldVal.REQUIRED_ERROR, output);
        })

        it('should use a provided emit function', function() {
            var emit_called = false;
            var output = FieldVal.type('number',{parse: true}).check('36', function(new_value){
                emit_called = true;
                assert.strictEqual(36, new_value);
            });
            assert.strictEqual(true, emit_called);
        })

        it('should complete without errors and without emit', function() {
            var output = FieldVal.type('number',{parse: true}).check('36');
            assert.strictEqual(undefined, output);
        })
    })
    describe('default_value()', function() {
        it('should use a default if the value is missing', function() {
            var validator = new FieldVal({});
            var value = validator.default_value("the_default").get("my_key", bval.string(true));
            assert.strictEqual(value, "the_default");
        })

        it('should use the value if it is present', function() {
            var validator = new FieldVal({
                "my_key": "actual_value"
            });
            var value = validator.default_value("the_default").get("my_key", bval.string(true));
            assert.strictEqual(value, "actual_value");
        })
    })
    describe('missing()', function() {
        it('end() should return an error with the missing key if missing field is added', function() {
            var validator = new FieldVal({});
            validator.missing("a_missing_field");
            var expected = {
                missing: {
                    'a_missing_field': {
                        error_message: 'Field missing.',
                        error: 1
                    }
                },
                error_message: 'One or more errors.',
                error: 0
            };
            var actual = validator.end();
            assert.deepEqual(expected, actual);
        })
    })
    describe('invalid()', function() {
        it('end() should return an error with the invalid key if an_invalid_field is added', function() {
            var validator = new FieldVal({});
            var invalid_details = {
                error: 1000,
                error_message: 'My custom error'
            }
            validator.invalid("an_invalid_field", invalid_details);
            var expected = {
                invalid: {
                    'an_invalid_field': {
                        error: 1000,
                        error_message: 'My custom error'
                    }
                },
                error_message: 'One or more errors.',
                error: 0
            };
            var actual = validator.end();
            assert.deepEqual(expected, actual);
        })

        it('should build an error of multiple errors if called with the same key', function() {
            var validator = new FieldVal({});

            validator.invalid("my_key", {
                "error": 1000,
                "error_message": "The first error"
            })
            validator.invalid("my_key", {
                "error": 1001,
                "error_message": "The second error"
            })
            validator.invalid("my_key", {
                "error": 1002,
                "error_message": "The third error"
            })

            var expected = {
                invalid: {
                    'my_key': {
                        "error": 4,
                        "error_message": "Multiple errors.",
                        "errors": [
                            {
                                "error": 1000,
                                "error_message": "The first error"
                            },{
                                "error": 1001,
                                "error_message": "The second error"
                            },{
                                "error": 1002,
                                "error_message": "The third error"
                            }

                        ]
                    }
                },
                error_message: 'One or more errors.',
                error: 0
            };
            var actual = validator.end();
            assert.deepEqual(expected, actual);
        })
    })
    describe('unrecognized()', function(){
        it('should return an unrecognized error when a field is manually unrecognized', function() {
            var validator = new FieldVal({})
            validator.unrecognized("my_string");
            assert.deepEqual(
                validator.end(),
                {
                    "unrecognized":{
                        "my_string":{
                            "error_message":"Unrecognized field.",
                            "error":3
                        }
                    },
                    "error_message":"One or more errors.",
                    "error":0
                }
            );
        })

        it('should retain a single error when a field is manually and automatically unrecognized', function() {
            var validator = new FieldVal({
                my_string: "my_value"
            })
            validator.unrecognized("my_string");
            assert.deepEqual(
                validator.end(),
                {
                    "unrecognized":{
                        "my_string":{
                            "error_message":"Unrecognized field.",
                            "error":3
                        }
                    },
                    "error_message":"One or more errors.",
                    "error":0
                }
            );
        })
    })
    describe('unrecognized()', function(){
        it('should not return an error when a field is manually recognized', function() {
            var validator = new FieldVal({
                my_string: 'my_value'
            })
            validator.recognized("my_string");
            assert.strictEqual(
                validator.end(),
                undefined
            );
        })
    })
    describe('end()', function() {
        it('should return null if constructed with a null parameter', function() {
            var validator = new FieldVal(null);
            assert.equal(null, validator.end());
        })
        it('should return null if constructed with an empty object', function() {
            var validator = new FieldVal({});
            assert.equal(null, validator.end());
        })
        it('should return a valid structure if a required field wasn\'t present', function() {
            var validator = new FieldVal({});
            validator.get("my_integer", FieldVal.required(true))
            var expected = {
                "missing": {
                    "my_integer": {
                        "error_message": "Field missing.",
                        "error": 1
                    }
                },
                "error_message": "One or more errors.",
                "error": 0
            };
            var actual = validator.end();
            assert.deepEqual(expected, actual);
        })
        it('should return a valid structure if a field wasn\'t recognized', function() {
            var validator = new FieldVal({
                my_integer: 57
            });
            var expected = {
                "unrecognized": {
                    "my_integer": {
                        "error_message": "Unrecognized field.",
                        "error": 3
                    }
                },
                "error_message": "One or more errors.",
                "error": 0
            };
            var actual = validator.end();
            assert.deepEqual(expected, actual);
        })
        it('should return a multiple error structure if there is an existing error and a field error', function() {
            var validator = new FieldVal({
                my_integer: 57
            });
            validator.error({
                "error": 1000,
                "error_message": "An existing error"
            });
            var expected = {
                "error":4,
                "error_message":"Multiple errors.",
                "errors":[
                    {
                        "error": 1000,
                        "error_message": "An existing error"
                    },{
                        "unrecognized": {
                            "my_integer": {
                                "error_message": "Unrecognized field.",
                                "error": 3
                            }
                        },
                        "error_message": "One or more errors.",
                        "error": 0
                    }
                ]
            };
            var actual = validator.end();
            assert.deepEqual(expected, actual);
        })
        it('should return null if only optional fields aren\'t present', function() {
            var validator = new FieldVal({});
            validator.get("my_integer")
            assert.equal(null, validator.end());
        })
    })
})