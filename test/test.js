var logger = require("tracer").console();
var FieldVal = require('fieldval');
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
        it('should return value when the value is present', function() {
            var my_validator = new FieldVal({
                "my_value": 13
            })
            assert.equal(13, my_validator.get("my_value"));
        })
    })
    describe('missing()', function() {
        it('end() should return an error with the missing key if missing field is added', function() {
            var my_validator = new FieldVal({});
            my_validator.missing("A Missing Field");
            var expected = {
                missing: {
                    'A Missing Field': {
                        error_message: 'Field missing.',
                        error: 1
                    }
                },
                error_message: 'One or more errors.',
                error: 0
            };
            var actual = my_validator.end();
            assert.deepEqual(expected, actual);
        })
    })
    describe('invalid()', function() {
        it('end() should return an error with the invalid key if an_invalid_field is added', function() {
            var my_validator = new FieldVal({});
            var invalidDetails = {
                error: 1000,
                error_message: 'My custom error'
            }
            my_validator.invalid("an_invalid_field", invalidDetails);
            var expected = {
                invalid: {
                    'an_invalid_field': invalidDetails
                },
                error_message: 'One or more errors.',
                error: 0
            };
            var actual = my_validator.end();
            assert.deepEqual(expected, actual);
        })
    })
    describe('unrecognized', function(){
        it('should return null when the requested value is not present', function() {
            var my_validator = new FieldVal({
                "my_string": 13
            })
            assert.deepEqual(
                my_validator.end(),
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
    describe('end()', function() {
        it('should return null if constructed with a null parameter', function() {
            var my_validator = new FieldVal(null);
            assert.equal(null, my_validator.end());
        })
    })
    describe('end()', function() {
        it('should return null if constructed with an empty object', function() {
            var my_validator = new FieldVal({});
            assert.equal(null, my_validator.end());
        })
    })
    describe('end()', function() {
        it('should return a valid structure if a required field wasn\'t present', function() {
            var my_validator = new FieldVal({});
            my_validator.get("my_integer", FieldVal.required(true))
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
            var actual = my_validator.end();
            assert.deepEqual(expected, actual);
        })
        it('should return null if only optional fields aren\'t present', function() {
            var my_validator = new FieldVal({});
            my_validator.get("my_integer")
            assert.equal(null, my_validator.end());
        })
    })
})