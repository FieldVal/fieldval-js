```BasicVal.multiple_async(possibles, [flags])```

Validates the value with multiple checks, allowing one or more of the checks to be asynchronous. Only one of the checks need to pass for the value to be valid.

```possibles``` is an array of multiple checks.

In the example provided, a valid input would be either an integer or a string that begins with "abc".