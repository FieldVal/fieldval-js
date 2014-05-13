var Validator = require('../fieldval');
var bval = require('../fieldval').BasicVal;
var assert = require("assert")

describe('Validator', function() {
    describe('constructor', function() {
        it('should return an object if constructed with an empty object', function() {
            assert.equal("object", typeof new Validator({}));
        })
    })
    describe('constructor', function() {
        it('should return an object if constructed with a null parameter', function() {
            assert.equal("object", typeof new Validator(null));
        })
    })
    describe('get()', function() {
        it('should return value when the value is present', function() {
            var my_validator = new Validator({
                "my_value": 13
            })
            assert.equal(13, my_validator.get("my_value", bval.integer(true)));
        })

        it('should return value when an optional value is present', function() {
            var my_validator = new Validator({
                "my_value": 17
            })
            assert.equal(17, my_validator.get("my_value", bval.integer(false)));
        })

        it('should return an integer when an integer is requested and the value is an integer string', function() {
            var my_validator = new Validator({
                "my_integer": "26"
            })
            assert.equal(26, my_validator.get("my_integer", bval.integer(true)));
        })

        it('should return a float when an float is requested and the value is a float string', function() {
            var my_validator = new Validator({
                "my_float": "43.5"
            })
            assert.equal(43.5, my_validator.get("my_float", bval.float(true)));
        })

        it('should return null when the value is the wrong type', function() {
            var my_validator = new Validator({
                "my_string": 13
            })
            assert.equal(null, my_validator.get("my_string", bval.string(true)));
        })

        it('should return null when the requested value is not present', function() {
            var my_validator = new Validator({
                "my_string": 13
            })
            assert.equal(null, my_validator.get("Non-existant", bval.string(true)));
        })
    })
    describe('missing()', function() {
        it('end() should return an error with the missing key if missing field is added', function() {
            var my_validator = new Validator({});
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
            var my_validator = new Validator({});
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
    describe('end()', function() {
        it('should return null if constructed with a null parameter', function() {
            var my_validator = new Validator(null);
            assert.equal(null, my_validator.end());
        })
    })
    describe('end()', function() {
        it('should return null if constructed with an empty object', function() {
            var my_validator = new Validator({});
            assert.equal(null, my_validator.end());
        })
    })
    describe('end()', function() {
        it('should return a valid structure if a required field wasn\'t present', function() {
            var my_validator = new Validator({});
            my_validator.get("my_integer", bval.integer(true))
            var expected = {
                missing: {
                    "my_integer": {
                        error_message: "Field missing.",
                        error: 1
                    }
                },
                error_message: "One or more errors.",
                error: 0
            };
            var actual = my_validator.end();
            assert.deepEqual(expected, actual);
        })
        it('should return null if only optional fields aren\'t present', function() {
            var my_validator = new Validator({});
            my_validator.get("my_integer", bval.integer(false))
            assert.equal(null, my_validator.end());
        })
    })
})