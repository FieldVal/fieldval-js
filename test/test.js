var Validator = require('../lib/fieldval');
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
                "My Value": 13
            })
            assert.equal(13, my_validator.get("My Value", "integer", true));
        })

        it('should return value when an optional value is present', function() {
            var my_validator = new Validator({
                "My Value": 17
            })
            assert.equal(17, my_validator.get("My Value", "integer", false));
        })

        it('should return an integer when an integer is requested and the value is an integer string', function() {
            var my_validator = new Validator({
                "My Integer": "26"
            })
            assert.equal(26, my_validator.get("My Integer", "integer", true));
        })

        it('should return a float when an float is requested and the value is a float string', function() {
            var my_validator = new Validator({
                "My Float": "43.5"
            })
            assert.equal(43.5, my_validator.get("My Float", "float", true));
        })

        it('should return null when the value is the wrong type', function() {
            var my_validator = new Validator({
                "My String": 13
            })
            assert.equal(null, my_validator.get("My String", "string", true));
        })

        it('should return null when the requested value is not present', function() {
            var my_validator = new Validator({
                "My String": 13
            })
            assert.equal(null, my_validator.get("Non-existant", "string", true));
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
        it('end() should return an error with the invalid key if an invalid field is added', function() {
            var my_validator = new Validator({});
            var invalidDetails = {
                error: 1000,
                error_message: 'My custom error'
            }
            my_validator.invalid("An Invalid Field", invalidDetails);
            var expected = {
                invalid: {
                    'An Invalid Field': invalidDetails
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
            my_validator.get("My Integer", "integer", true)
            var expected = {
                missing: {
                    "My Integer": {
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
            my_validator.get("My Integer", "integer", false)
            assert.equal(null, my_validator.end());
        })
    })
})