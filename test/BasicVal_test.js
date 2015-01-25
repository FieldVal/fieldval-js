var FieldVal = require('../fieldval');
var bval = FieldVal.BasicVal;
var assert = require("assert")

describe('BasicVal', function() {
    describe('integer()', function() {
        it('should return value when the value is present', function() {
            var my_validator = new FieldVal({
                "my_value": 13
            })
            assert.equal(13, my_validator.get("my_value", bval.integer(true)));
            assert.strictEqual(null, my_validator.end());
        })

        it('should not continue if required=false and the value is missing', function(){
            var my_validator = new FieldVal({
                "another_value": 17
            })
            var called = false;
            my_validator.get("my_value", bval.integer({required: false}), function(value){
                called = true;
            });
            assert.equal(called, false);
        })

        it('should return value when an optional value is present', function() {
            var my_validator = new FieldVal({
                "my_value": 17
            })
            assert.equal(17, my_validator.get("my_value", bval.integer(false)));
            assert.strictEqual(null, my_validator.end());
        })

        it('should return an integer when an integer is requested and the value is an integer string and parse flag is true', function() {
            var my_validator = new FieldVal({
                "my_integer": "26"
            })
            assert.equal(26, my_validator.get("my_integer", bval.integer(true, {parse: true})));
            assert.strictEqual(null, my_validator.end());
        })

        it('should create an error when an integer is requested and the value is an integer string, but parse flag is not set to true', function() {
            var my_validator = new FieldVal({
                "my_integer": "26"
            })
            assert.strictEqual(undefined, my_validator.get("my_integer", bval.integer(true)));
            assert.deepEqual({
                "invalid":{
                    "my_integer":{
                        "error_message":"Incorrect field type. Expected integer.",
                        "error":2,
                        "expected":"integer",
                        "received":"string"
                    }
                },
                "error_message":"One or more errors.",
                "error":5
            }, my_validator.end());
        })
    })

    describe('array()', function() {

        it('array iteration and emit', function() {
            var my_validator = new FieldVal({
                "my_value": ["1",2,"3",4,5]
            })

            var my_value = my_validator.get(
                "my_value", 
                bval.array(true)
                ,
                bval.each(function(value, index, emit){
                    var error = bval.integer(true,{parse: true}).check(value,emit);
                    return error;
                },{
                    //Flags
                })
                , 
                function(value, emit){
                    var count = 0;
                    for(var i = 0; i < value.length; i++){
                        count += value[i];
                    }
                    emit(count);
                }
            )

            var val_error = my_validator.end();
            assert.equal(15, my_value);
            assert.strictEqual(null, val_error);
        })

        it('should return any errors thrown by the iterator', function() {
            var my_validator = new FieldVal({
                "my_value": [1,2,"three",4,5]
            })

            var my_value = my_validator.get("my_value", bval.array(true), bval.each(function(value, index){
                var error = bval.integer(true).check(value);
                return error;
            }));

            var val_error = my_validator.end();
            assert.strictEqual(undefined, my_value);
            assert.deepEqual({
                "invalid": {
                    "my_value": {
                        "invalid": {
                            "2": {
                                "error_message": "Incorrect field type. Expected integer.",
                                "error": 2,
                                "expected": "integer",
                                "received": "string"
                            }
                        },
                        "error_message": "One or more errors.",
                        "error": 5
                    }
                },
                "error_message": "One or more errors.",
                "error": 5
            }, val_error);
        })

        it('array iteration async and emit', function(done) {
            var my_validator = new FieldVal({
                "my_value": ["1",2,"3",4,5]
            })

            var my_value;

            my_validator.get_async(
                "my_value", 
                [
                    bval.array(true),
                    bval.each_async(function(value, index, emit, next){
                        setTimeout(function(){
                            var error = bval.integer(true,{parse: true}).check(value,emit);
                            next(error);
                        },1);
                    },{
                        //Flags
                    }),
                    function(value, emit){
                        var count = 0;
                        for(var i = 0; i < value.length; i++){
                            count += value[i];
                        }
                        emit(count);
                    }
                ],
                function(output){
                    my_value = output;
                }
            );

            my_validator.end(function(val_error){
                assert.equal(15, my_value);
                assert.strictEqual(null, val_error);
                done();
            });
        })
    })

    describe('object()', function() {
        it('object iteration and emit', function() {
            var my_validator = new FieldVal({
                "my_value": {
                    "one": "1",
                    "two": 2,
                    "three": "3",
                    "four": 4,
                    "five": 5
                }
            })

            var my_value = my_validator.get(
                "my_value", 
                bval.object(true)
                ,
                bval.each(function(value, index, emit){
                    var error = bval.integer(true,{parse: true}).check(value,emit);
                    return error;
                },{
                    //Flags
                })
                , 
                function(value, emit){
                    var count = 0;
                    for(var i in value){
                        if(value.hasOwnProperty(i)){
                            count += value[i];
                        }
                    }
                    emit(count);
                }
            )

            var val_error = my_validator.end();
            assert.equal(15, my_value);
            assert.strictEqual(null, val_error);
        })

        it('object iteration async and emit', function(done) {
            var my_validator = new FieldVal({
                "my_value": {
                    "one": "1",
                    "two": 2,
                    "three": "3",
                    "four": 4,
                    "five": 5
                }
            })

            var my_value;

            my_validator.get_async(
                "my_value", 
                [
                    bval.object(true),
                    bval.each_async(function(value, index, emit, next){
                        setTimeout(function(){
                            var error = bval.integer(true,{parse: true}).check(value,emit);
                            next(error);
                        },1);
                    },{
                        //Flags
                    }),
                    function(value, emit){
                        var count = 0;
                        for(var i in value){
                            if(value.hasOwnProperty(i)){
                                count += value[i];
                            }
                        }
                        emit(count);
                    }
                ],
                function(output){
                    my_value = output;
                }
            );

            my_validator.end(function(val_error){
                assert.equal(15, my_value);
                assert.strictEqual(null, val_error);
                done();
            });
        })
    })

    describe('minimum()', function() {

        it('should return a value when it is above the specified value', function() {
            var my_validator = new FieldVal({
                "my_value": 11
            })
            assert.equal(11, my_validator.get("my_value", bval.integer(true), bval.minimum(10)));
            assert.strictEqual(null, my_validator.end());
        })

        it('should return a value when it is equal to the specified value', function() {
            var my_validator = new FieldVal({
                "my_value": 10
            })
            assert.equal(10, my_validator.get("my_value", bval.integer(true), bval.minimum(10,{})));
            assert.strictEqual(null, my_validator.end());
        })

        it('should create an error when the value is below the specified value', function() {
            var my_validator = new FieldVal({
                "my_value": 9
            })
            assert.strictEqual(undefined, my_validator.get("my_value", bval.integer(true), bval.minimum(10)));
            assert.deepEqual({
                "invalid":{
                    "my_value":{
                        "error":102,
                        "error_message":"Value is less than 10"
                    }
                },
                "error_message":"One or more errors.",
                "error":5
            }, my_validator.end());
        })
    })

    describe('maximum()', function() {

        it('should return a value when it is below the specified value', function() {
            var my_validator = new FieldVal({
                "my_value": 9
            })
            assert.equal(9, my_validator.get("my_value", bval.integer(true), bval.maximum(10)));
            assert.strictEqual(null, my_validator.end());
        })

        it('should return a value when it is equal to the specified value', function() {
            var my_validator = new FieldVal({
                "my_value": 10
            })
            assert.equal(10, my_validator.get("my_value", bval.integer(true), bval.maximum(10,{})));
            assert.strictEqual(null, my_validator.end());
        })

        it('should create an error when the value is below the specified value', function() {
            var my_validator = new FieldVal({
                "my_value": 11
            })
            assert.strictEqual(undefined, my_validator.get("my_value", bval.integer(true), bval.maximum(10)));
            assert.deepEqual({
                "invalid":{
                    "my_value":{
                        "error":103,
                        "error_message":"Value is greater than 10"
                    }
                },
                "error_message":"One or more errors.",
                "error":5
            }, my_validator.end());
        })
    })

    describe('does_not_contain()', function() {

        it('should return a value when it does not contain the specified characters', function() {
            var my_validator = new FieldVal({
                "my_value": "ABCDEF"
            })
            assert.equal("ABCDEF", my_validator.get("my_value", bval.string(true), bval.does_not_contain(["G","H","I"])));
            assert.strictEqual(null, my_validator.end());
        })

        it('should create an error when the value contains any of the specified characters', function() {
            var my_validator = new FieldVal({
                "my_value": "ABCDEF"
            })
            assert.strictEqual(undefined, my_validator.get("my_value", bval.string(true), bval.does_not_contain(["A","C","F"])));
            assert.deepEqual({
                "invalid":{
                    "my_value":{
                        "error":105,
                        "error_message":"Cannot contain A,C,F"
                    }
                },
                "error_message":"One or more errors.",
                "error":5
            }, my_validator.end());
        })
    })

    describe('min_length()', function() {

        it('should return a value when it is longer than the specified length', function() {
            var my_validator = new FieldVal({
                "my_value": "ABCDEF"
            })
            assert.equal("ABCDEF", my_validator.get("my_value", bval.string(true), bval.min_length(5)));
            assert.strictEqual(null, my_validator.end());
        })

        it('should return a value when it\'s length is equal to the specified length', function() {
            var my_validator = new FieldVal({
                "my_value": "ABCDE"
            })
            assert.equal("ABCDE", my_validator.get("my_value", bval.string(true), bval.min_length(5,{})));
            assert.strictEqual(null, my_validator.end());
        })

        it('should create an error when the value is below the specified value', function() {
            var my_validator = new FieldVal({
                "my_value": "ABCD"
            })
            assert.strictEqual(undefined, my_validator.get("my_value", bval.string(true), bval.min_length(5)));
            assert.deepEqual({
                "invalid":{
                    "my_value":{
                        "error":100,
                        "error_message":"Length is less than 5"
                    }
                },
                "error_message":"One or more errors.",
                "error":5
            }, my_validator.end());
        })
    })

    describe('multiple()', function() {

        it('should return an error if none of the options are valid', function() {
            var my_validator = new FieldVal({
                "my_string": "ABCDE"
            })

            //Up to 3 characters, or 6+
            assert.strictEqual(undefined, my_validator.get("my_string", /*bval.string(true), */bval.multiple(
                [
                    bval.max_length(3),
                    bval.min_length(6)
                ]
            )));
            assert.deepEqual({
                "invalid":{
                    "my_string":{
                        "error":115,
                        "error_message":"None of the options were valid."
                    }
                },
                "error_message":"One or more errors.",
                "error": 5
            }, my_validator.end());
        })

        it('should return the valid value if one of the options is valid (and use emit functions)', function() {
            var my_validator = new FieldVal({
                "my_string": "ABCDEFG"
            })

            var shorter, longer, output;

            output = my_validator.get("my_string", /*bval.string(true), */bval.multiple(
                [
                    [
                        bval.max_length(3), function(value){
                            shorter = value;
                        }
                    ]
                    ,
                    [
                        bval.min_length(6), function(value){
                            longer = value;
                        }
                    ]
                ]
            ))

            //Up to 3 characters, or 6+
            assert.equal("ABCDEFG", output);
            assert.equal(null, shorter);
            assert.equal("ABCDEFG", longer);
            assert.strictEqual(null, my_validator.end());
        })

        it('should return the valid value if one of the options is valid (and use emit functions) - async', function(done) {
            var my_validator = new FieldVal({
                "my_string": "ABCDEFG"
            })

            var shorter, longer, output, did_return = false;

            my_validator.get_async("my_string",[bval.string(true), bval.multiple_async(
                [
                    [
                        function(value, emit, callback){
                            setTimeout(function(){
                                callback(bval.max_length(3).check(value))
                            },1)
                        }, function(value){
                            shorter = value;
                        }
                    ]
                    ,
                    [
                        bval.min_length(6), function(value){
                            longer = value;
                        }
                    ]
                ]
            )], function(response){
                did_return = true;
                output = response;
                assert.deepEqual();
            })

            //Up to 3 characters, or 6+
            my_validator.end(function(error_output){

                assert.equal(did_return, true);
                assert.equal("ABCDEFG", output);

                assert.equal(null, shorter);
                assert.equal("ABCDEFG", longer);

                done();
            });
        })
    })

    describe('email()', function() {

        it('should return an email when an string of valid syntax is present', function() {
            var my_validator = new FieldVal({
                "my_email": "example-user@test.com"
            })
            var email = my_validator.get("my_email", bval.email());
            assert.deepEqual(null, my_validator.end());
            assert.equal("example-user@test.com", email);
        })

        it('should return no errors if the key requested is not present', function() {
            var my_validator = new FieldVal({
                //No fields
            })
            var email = my_validator.get("my_email", bval.email(false));
            assert.deepEqual(null, my_validator.end());
            assert.strictEqual(undefined, email);
        })

        it('should return a required error if the key is missing and required is set to true', function() {
            var my_validator = new FieldVal({
                //No fields
            })
            var email = my_validator.get("my_email", bval.email({required:true}));
            assert.deepEqual({
                "missing":{
                    "my_email":{
                        "error_message":"Field missing.",
                        "error":1
                    }
                },
                "error_message":"One or more errors.",
                "error":5
            }, my_validator.end());
            assert.strictEqual(undefined, email);
        })

        it('should create an error when a type other than a string is present', function() {
            var my_validator = new FieldVal({
                "my_email": 123
            })
            assert.strictEqual(undefined, my_validator.get("my_email", bval.email(true)));
            assert.deepEqual({
                "invalid":{
                    "my_email":{
                        "error":2,
                        "error_message":"Incorrect field type. Expected string.",
                        "expected": "string",
                        "received": "number"
                    }
                },
                "error_message":"One or more errors.",
                "error":5
            }, my_validator.end());
        })

        it('should create an error when a string of invalid syntax is present', function() {
            var my_validator = new FieldVal({
                "my_email": "example@user"
            })
            assert.strictEqual(undefined, my_validator.get("my_email", bval.email(true)));
            assert.deepEqual({
                "invalid":{
                    "my_email":{
                        "error":107,
                        "error_message":"Invalid email address format."
                    }
                },
                "error_message":"One or more errors.",
                "error":5
            }, my_validator.end());
        })
    })

    describe('url()', function() {

        it('should return url strings when strings of valid syntax are present', function() {
            var my_validator = new FieldVal({
                "my_url_1": "http://example.com",
                "my_url_2": "https://example.com",
                "my_url_3": "http://www.example.com",
                "my_url_4": "https://www.example.com/",
                "my_url_5": "http://www.example.com/path/",
                "my_url_6": "http://www.example.com/path/resource.type",
                "my_url_7": "http://127.0.0.1/images/example.jpg",
                "my_url_8": "https://127.0.0.1/images/example.jpg"
            })

            assert.equal("http://example.com", my_validator.get("my_url_1", bval.string(true), bval.url()));
            assert.equal("https://example.com", my_validator.get("my_url_2", bval.string(true), bval.url()));
            assert.equal("http://www.example.com", my_validator.get("my_url_3", bval.string(true), bval.url()));
            assert.equal("https://www.example.com/", my_validator.get("my_url_4", bval.string(true), bval.url()))
            assert.equal("http://www.example.com/path/", my_validator.get("my_url_5", bval.string(true), bval.url()));
            assert.equal("http://www.example.com/path/resource.type", my_validator.get("my_url_6", bval.string(true), bval.url()));
            assert.equal("http://127.0.0.1/images/example.jpg", my_validator.get("my_url_7", bval.string(true), bval.url()));
            assert.equal("https://127.0.0.1/images/example.jpg", my_validator.get("my_url_8", bval.string(true), bval.url()));
            assert.strictEqual(null, my_validator.end());
        })
    })

    describe('number()', function() {

        it('should return a number when an number is requested and the value is a number string and parse flag is true', function() {
            var my_validator = new FieldVal({
                "my_number": "43.5"
            })
            assert.equal(43.5, my_validator.get("my_number", bval.number(true, {parse: true})));
            assert.strictEqual(null, my_validator.end());
        })

        it('should create an error when an number is requested and the value is a number string, but parse flag is not set to true', function() {
            var my_validator = new FieldVal({
                "my_number": "43.5"
            })
            assert.strictEqual(undefined, my_validator.get("my_number", bval.number(true)));
            assert.deepEqual({"invalid":{"my_number":{"error_message":"Incorrect field type. Expected number.","error":2,"expected":"number","received":"string"}},"error_message":"One or more errors.","error":5}, my_validator.end());
        })

        it('should create a custom error when one is provided (number)', function() {
            var my_validator = new FieldVal({
                "my_number": "42"
            })
            assert.strictEqual(undefined, my_validator.get(
                "my_number", 
                bval.number(true, {
                    error:{
                        error: 1000,
                        error_message: "Please enter a number"
                    }
                })
            ));
            assert.deepEqual({"invalid":{"my_number":{"error":1000,"error_message":"Please enter a number"}},"error_message":"One or more errors.","error":5}, my_validator.end());
        })
    })

    describe('string()', function() {

        it('should create a custom error when one is provided (string)', function() {
            var my_validator = new FieldVal({
                "my_string": 42
            })
            assert.strictEqual(undefined, my_validator.get(
                "my_string", 
                bval.string(true, {
                    error:{
                        error: 1001,
                        error_message: "Please enter text"
                    }
                })
            ));
            assert.deepEqual({"invalid":{"my_string":{"error":1001,"error_message":"Please enter text"}},"error_message":"One or more errors.","error":5}, my_validator.end());
        })

        it('should return null when the value is the wrong type', function() {
            var my_validator = new FieldVal({
                "my_string": 13
            })
            assert.strictEqual(undefined, my_validator.get("my_string", bval.string(true)));
            assert.deepEqual({"invalid":{"my_string":{"error_message":"Incorrect field type. Expected string.","error":2,"expected":"string","received":"number"}},"error_message":"One or more errors.","error":5}, my_validator.end())
        })
    })
})