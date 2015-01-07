FieldVal allows multiple checks to be "chained" in series to validate a single value. This allows code re-use and improves readability of validation checks.

```javascript
var my_integer = validator.get("my_integer", BasicVal.integer(true))
```

checks that the value is an integer and the ```true``` argument indicates that it is required.

```javascript
var my_integer = validator.get("my_integer", BasicVal.integer(true), BasicVal.minimum(42))
```

now also checks that the integer is at least ```42```. 

You can add as many checks as you like from [here](https://github.com/FieldVal/fieldval-basicval-js/), or just write your own - they're just functions that return errors.