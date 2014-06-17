The FieldVal-JS library allows you to easily validate objects and provide readable and structured error reports.

```javascript
//Import FieldVal and FieldVal-BasicVal (some simple checks)
var FieldVal = require('fieldval');
var bval = require('fieldval-basicval');

//Have some data to validate
var data = {
    my_number: "clearly not a number"
}

//Create a FieldVal instance using the data
var validator = new FieldVal(data);

//Get values using validator.get(field_name, field_type, required)
var my_number = validator.get("my_number", bval.integer(true));

//Log the result of the validation (null if no errors)
console.log(validator.end());

```

Output:
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

FieldVal Modules
============
* FieldVal-JS (This repository)

   The core of FieldVal - provides basic validation functionality such as getting keys from an object and allows chaining of checks.
   
* FieldVal-BasicVal-JS

   Basic checks and errors for required fields, type checking, length and numeric rules.
   
* FieldVal-UI

   A companion library that creates customizable forms that parse and display FieldVal error structures.
   

NodeJS Usage
=============
To install the node packages, run:
```bash
npm install fieldval
npm install fieldval-basicval
```

Bower Usage
=============
The FieldVal library works both as a node package and via the browser. To install the node packages, run:
```bash
bower install fieldval
bower install fieldval-basicval
```

How to use in the browser
=============
To use in the browser, download and include the ```fieldval.js``` file from this repository and ```fieldval-basicval.js``` from [https://github.com/FieldVal/fieldval-basicval-js/](https://github.com/FieldVal/fieldval-basicval-js/).

Development
=============

This project uses [gulp.js](http://gulpjs.com/) to build and [mocha](http://visionmedia.github.io/mocha/) to test.

```bash
npm install
gulp js
mocha test/test
```