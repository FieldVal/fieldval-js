FieldVal libraries use a common error structure to make it easy to transport errors straight from a validation check, all the way to an end user. The most basic error structure is provided as an example to the right.

To avoid conflicting with FieldVal errors (that begin at 0), your errors should start at 1000.