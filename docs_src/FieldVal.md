FieldVal is a Javascript library that allows you to easily create readable and structured error reports for any data.

It works on both the front end in the browser and on the back end using Node.

FieldVal comes with a collection of checks called BasicVal. These are standard checks such as email, numeric limits etc., but you can write your own FieldVal checks with simple functions.

To start validating, pass your data to a new instance of ```FieldVal```.

Then use ```.get()``` to retrieve values whilst simultatenously building an error report.

When you've finished validating, use ```.end()``` to retrieve the error report or null if there were no errors.

####Run the code example to the right####

Try out FieldVal using CodePen by clicking the "Run on Codepen" button below the example.

Try changing the data provided to ```FieldVal``` to see how the error changes.