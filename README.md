Overview
==============
The FieldVal library allows you to easily validate objects and provide readable and structured error reports.

How to use
=============
The FieldVal library works both as a node package and via the browser. To install the node package, run:
```bash
npm install fieldval
```

To use in the browser, download and include the ```fieldval.min.js``` file.

Basic Usage
=============
```javascript

//Import FieldVal
var Validator = require('fieldval');

//Get a reference to BasicVal - FieldVal's built-in validators
var bval = Validator.BasicVal;

//Have some data to validate
var data = {
    my_number: "clearly not a number"
}

//Create a Validator instance using the data
var validator = new Validator(data);

//Get values using validator.get(field_name, field_type, required)
var my_number = validator.get("my_number", bval.integer(true));

//Create an error for the validation (null if no errors)
var error = validator.end();
```

The ```error``` in this instance will be:
```json
{
  "invalid": {
    "my_number": {
      "error_message": "Incorrect field type. Expected integer.",
      "error": 2,
      "expected": "integer",
      "received": "string"
    }
  },
  "error_message": "One or more errors.",
  "error": 0
}
```

Development
=============
```bash
npm install
gulp js
```