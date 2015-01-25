```BasicVal.date(format, [flags])```

Checks if the string value is a valid date in a specified format.

Valid date components are;
- ```yyyy``` 4 digit year (i.e 2015)
- ```yy``` 2 digit year (i.e. 15)
- ```MM``` months (i.e. 01)
- ```M``` months without zero padding (i.e. 1)
- ```dd``` days (i.e. 01)
- ```d``` days without zero padding (i.e. 1)
- ```hh``` hours (i.e. 08)
- ```h``` hours without zero padding (i.e. 8)
- ```mm``` minutes (i.e. 23)
- ```m``` minutes without zero padding (i.e. 2)
- ```ss``` seconds (i.e. 49)
- ```s``` seconds without zero padding (i.e. 02)

Valid separators:
- ``` ``` (whitespace)
- ```-```
- ```/```
- ```:```

Optional flags.emit options
```DateVal.EMIT_COMPONENT_ARRAY``` emits an array with date component values in the right order
```DateVal.EMIT_OBJECT``` emits an object in a following format:
```
{
	year: 2014,
	month: 12,
	day: 12,
	hour: 23,
	minute: 49,
	second: 58
}
```

```DateVal.EMIT_DATE``` emits a standard JavaScript Date object