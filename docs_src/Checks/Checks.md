FieldVal checks are simple functions that take a value and an emit function and return an error if the value was invalid. If the value is valid, the function does not return anything.

* ```value``` is the value that this check is validating.
* ```emit``` is a function that the check can use to change the value for subsequent checks and for the eventual output. ([more info](/docs/fieldval/Custom Check Functions/emit))