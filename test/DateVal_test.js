var FieldVal = require('../fieldval');
var BasicVal = FieldVal.BasicVal;
var DateVal = FieldVal.DateVal;
var assert = require("assert")

describe('DateVal', function() {
    describe('date()', function() {
        it('should return a date string when a string of valid syntax is present', function() {
            var my_validator = new FieldVal({
                "my_date_1": "04/07/2014",
                "my_date_2": "1/2/34",
                "my_date_3": "1-2-34",
                "my_date_4": "29:2",
                "my_date_5": "2014 05 27",
                "my_date_6": "07/30/14",
                "my_date_7": "30/07/14",
                "my_date_8": "29/02/2004",
                "my_date_9": "29/05/2014 15:45:12",
            })

            assert.equal("04/07/2014", my_validator.get("my_date_1", BasicVal.string(true), BasicVal.date("dd/MM/yyyy")));
            assert.equal("1/2/34", my_validator.get("my_date_2", BasicVal.string(true), BasicVal.date("d/M/yy")));
            assert.equal("1-2-34", my_validator.get("my_date_3", BasicVal.string(true), BasicVal.date("d-M-yy")));
            assert.equal("29:2", my_validator.get("my_date_4", BasicVal.string(true), BasicVal.date("d:M")));
            assert.equal("2014 05 27", my_validator.get("my_date_5", BasicVal.string(true), BasicVal.date("yyyy MM dd")));
            assert.equal("07/30/14", my_validator.get("my_date_6", BasicVal.string(true), BasicVal.date("MM/dd/yy")));
            assert.equal("30/07/14", my_validator.get("my_date_7", BasicVal.string(true), BasicVal.date("dd/MM/yy")));
            assert.equal("29/02/2004", my_validator.get("my_date_8", BasicVal.string(true), BasicVal.date("dd/MM/yyyy")));
            assert.equal("29/05/2014 15:45:12", my_validator.get("my_date_9", BasicVal.string(true), BasicVal.date("dd/MM/yyyy hh:mm:ss")));
            assert.equal(null, my_validator.end());
        }) 

        it('should return errors when strings of invalid syntax are present', function() {
            var my_validator = new FieldVal({
                "my_date_1": "04/",
                "my_date_2": "1/2/",
                "my_date_3": "1-",
                "my_date_4": "29::",
                "my_date_5": "2014  ",
                "my_date_6": "07",
                "my_date_7": "a",
                "my_date_8": "()",
                "my_date_9": "-:/ ",
                "my_date_10": "2012-12-2"
            })

            assert.equal(undefined, my_validator.get("my_date_1", BasicVal.string(true), BasicVal.date("dd/MM/yyyy")));
            assert.equal(undefined, my_validator.get("my_date_2", BasicVal.string(true), BasicVal.date("d/M/yy")));
            assert.equal(undefined, my_validator.get("my_date_3", BasicVal.string(true), BasicVal.date("d-M-yy")));
            assert.equal(undefined, my_validator.get("my_date_4", BasicVal.string(true), BasicVal.date("d:M")));
            assert.equal(undefined, my_validator.get("my_date_5", BasicVal.string(true), BasicVal.date("yyyy MM dd")));
            assert.equal(undefined, my_validator.get("my_date_6", BasicVal.string(true), BasicVal.date("MM/dd/yy")));
            assert.equal(undefined, my_validator.get("my_date_7", BasicVal.string(true), BasicVal.date("dd/MM/yy")));
            assert.equal(undefined, my_validator.get("my_date_8", BasicVal.string(true), BasicVal.date("dd/MM/yyyy")));
            assert.equal(undefined, my_validator.get("my_date_9", BasicVal.string(true), BasicVal.date("dd/MM/yyyy hh:mm:ss")));
            assert.equal(undefined, my_validator.get("my_date_10", BasicVal.string(true), BasicVal.date("yyyy-MM-dd")));
            var actual = my_validator.end();
            var expected = {
                "invalid": {
                    "my_date_1": {
                        "error": 111,
                        "error_message": "Invalid date format.",
                        "format": "dd/MM/yyyy"
                    },
                    "my_date_2": {
                        "error": 111,
                        "error_message": "Invalid date format.",
                        "format": "d/M/yy"
                    },
                    "my_date_3": {
                        "error": 111,
                        "error_message": "Invalid date format.",
                        "format": "d-M-yy"
                    },
                    "my_date_4": {
                        "error": 111,
                        "error_message": "Invalid date format.",
                        "format": "d:M"
                    },
                    "my_date_5": {
                        "error": 111,
                        "error_message": "Invalid date format.",
                        "format": "yyyy MM dd"
                    },
                    "my_date_6": {
                        "error": 111,
                        "error_message": "Invalid date format.",
                        "format": "MM/dd/yy"
                    },
                    "my_date_7": {
                        "error": 111,
                        "error_message": "Invalid date format.",
                        "format": "dd/MM/yy"
                    },
                    "my_date_8": {
                        "error": 111,
                        "error_message": "Invalid date format.",
                        "format": "dd/MM/yyyy"
                    },
                    "my_date_9": {
                        "error": 111,
                        "error_message": "Invalid date format.",
                        "format": "dd/MM/yyyy hh:mm:ss"
                    },
                    "my_date_10": {
                        "error": 111,
                        "error_message": "Invalid date format.",
                        "format": "yyyy-MM-dd"
                    }
                },
                "error_message": "One or more errors.",
                "error": 5
            };
            assert.deepEqual(expected, actual);
        }) 
    })

    describe('date_format()', function() {
        it('should return a date format array when a valid string is provided', function() {
            var my_validator = new FieldVal({
                "my_format": "yyyy-MM-dd"
            })
            assert.deepEqual(["yyyy","-","MM","-","dd"], my_validator.get("my_format", BasicVal.string(true), BasicVal.date_format()));
            assert.equal(null, my_validator.end());
        })
    })

    describe('date_with_format_array()', function() {
        it('should return a string of the provided date formatted with the provided format array', function() {
            
            var my_validator = new FieldVal({
                "my_format": "yyyy-MM-dd hh:mm:ss"
            })

            var format_array = my_validator.get("my_format", BasicVal.string(true), BasicVal.date_format());

            var test_date = new Date(Date.UTC(2014, 08, 10, 16, 05, 38));//'Wed Sep 10 2014 16:05:38 GMT+0100 (BST)');

            var as_string = DateVal.date_with_format_array(test_date, format_array);

            assert.equal("2014-09-10 16:05:38", as_string);

            assert.equal(null, my_validator.end());
        })

        it('should throw an exception for an undefined date format', function() {
            var test_date = new Date(Date.UTC(2014, 08, 10, 16, 05, 38));//'Wed Sep 10 2014 16:05:38 GMT+0100 (BST)');
        
            assert.throws(function() { 
                DateVal.date_with_format_array(test_date, undefined); 
            }, Error);
        })

        it('should throw an exception for a date format array containing invalid components', function() {
            var test_date = new Date(Date.UTC(2014, 08, 10, 16, 05, 38));//'Wed Sep 10 2014 16:05:38 GMT+0100 (BST)');
        
            assert.throws(function() { 
                DateVal.date_with_format_array(test_date, ['yyyy','-','notacomponent']); 
            }, Error);
        })

        it('should throw an exception for a date format array containing a non-string component', function() {
            var test_date = new Date(Date.UTC(2014, 08, 10, 16, 05, 38));//'Wed Sep 10 2014 16:05:38 GMT+0100 (BST)');
        
            assert.throws(function() { 
                DateVal.date_with_format_array(test_date, ['yyyy',5,'dd']); 
            }, Error);
        })
    })

    describe('pad_to_valid()', function() {
        it('should add padding to a valid natural number', function() {
            assert.equal("0031", DateVal.pad_to_valid("31", [4]));
        })

        it('should not add padding to a negative number', function() {
            assert.equal("-31", DateVal.pad_to_valid("-31", [4]));
        })

        it('should not add padding to a number with a decimal fraction', function() {
            assert.equal("0.3", DateVal.pad_to_valid("0.3", [4]));
        })

        it('should not add padding to a number in scientific notation', function() {
            assert.equal("1e2", DateVal.pad_to_valid("1e2", [4]));
        })
    })
})