Sometimes it is useful to create a structured error for a specific field without validating a value. This can be achieved by calling one of the following FieldVal object's methods:

* ```error(field_name, error) ``` 
* ```unrecognized(field_name) ``` 
* ```missing(field_name) ``` 

```.unrecognized()``` and ```.missing()``` are wrappers around ```.error()``` that insert the default errors.