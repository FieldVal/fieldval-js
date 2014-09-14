####THIS PROJECT SHOULD BE CONSIDERED "ALPHAWARE". ALTHOUGH WE USE THIS PROJECT IN PRODUCTION, WE ADVISE AGAINST DOING SO AT THIS STAGE UNLESS YOU ARE COMFORTABLE WITH FIXING BUGS YOURSELF.####

The FieldVal library allows you to easily validate objects and provide readable and structured error reports.

To start validating data, create a new instance of ```FieldVal``` with an object that you want to validates as the parameter.

Then use the ```.get()``` function of the validator to retrieve values whilst simultatenously building an error report.

When you've finished retrieving keys, use ```.end()``` on the validator to retreive the error report or null if there were no errors.

####Run the example to the right####
You can try out FieldVal using CodePen. Just click the "Run on CodePen" button and modify the code to see how you can use FieldVal. [FieldVal-All](http://github.com/FieldVal/fieldval-all-js) is included, so you can use BasicVal checks too.

Try changing the data provided to the ```FieldVal``` constructor to see how the error changes. (hint: It's expecting an integer greater than or equal to 10).