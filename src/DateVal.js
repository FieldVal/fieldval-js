var DateVal = (function(){
    "use strict";

    var DateVal = {
    	errors: {
            invalid_date_format: function() {
                return {
                    error: 111,
                    error_message: "Invalid date format."
                };
            },
            invalid_date: function() {
                return {
                    error: 112,
                    error_message: "Invalid date."
                };
            },
            invalid_date_format_string: function(){
                return {
                    error: 114,
                    error_message: "Invalid date format string."
                };
            }
        },
    	date_format: function(flags){

            flags = flags || {};

            var check = function(format, emit) {

                var format_array = [];

                var f = 0;
                var error = false;
                while(f < format.length && !error){
                    var handled = false;
                    for(var c in DateVal.date_components){
                        var substring = format.substring(f,f+c.length);
                        if(substring===c){
                            format_array.push(c);
                            f += c.length;
                            handled = true;
                            break;
                        }
                    }
                    if(!handled){
                        error = true;
                    }
                }

                if(error){
                    return FieldVal.create_error(DateVal.errors.invalid_date_format_string, flags);
                } else {
                    
                    if (flags.emit == DateVal.EMIT_STRING) {
                        emit(format);
                    } else {
                        emit(format_array);
                    }

                }
            };
            if(flags){
                flags.check = check;
                return flags;
            }
            return {
                check: check
            };
        },
        date_with_format_array: function(date, format_array){
            //Takes a Javascript Date object

            var date_string = "";

            for(var i = 0; i < format_array.length; i++){
                var component = format_array[i];
                var component_value = DateVal.date_components[component];
                if(component_value===0){
                    date_string+=component;
                } else {
                    var value_in_date;
                    if(component==='yyyy'){
                        value_in_date = date.getUTCFullYear();
                    } else if(component==='yy'){
                        value_in_date = date.getUTCFullYear().toString().substring(2);
                    } else if(component==='MM' || component==='M'){
                        value_in_date = date.getUTCMonth()+1;
                    } else if(component==='dd' || component==='d'){
                        value_in_date = date.getUTCDate();
                    } else if(component==='hh' || component==='h'){
                        value_in_date = date.getUTCHours();
                    } else if(component==='mm' || component==='m'){
                        value_in_date = date.getUTCMinutes();
                    } else if(component==='ss' || component==='s'){
                        value_in_date = date.getUTCSeconds();
                    }

                    date_string += DateVal.pad_to_valid(value_in_date.toString(), component_value);
                }
            }

            return date_string;
        },
        pad_to_valid: function(value, allowed){
            var numeric_value;
            var error = BasicVal.integer({parse:true}).check(value,function(parsed){
                numeric_value = parsed;
            });
            if (error || numeric_value<0) {
                return value;
            }
            
            for(var k = 0; k < allowed.length; k++){
                var allowed_length = allowed[k];

                if(value.length <= allowed_length){
                    var diff = allowed_length - value.length;
                    for(var m = 0; m < diff; m++){
                        value = "0"+value;
                    }
                    return value;
                }
            }
            return value;
        },
    	date: function(format, flags){

    		flags = flags || {};

            var format_array;

            var format_error = DateVal.date_format().check(format, function(emit_format_array){
                format_array = emit_format_array;
            });
            
            if(format_error){
                if(console.error){
                    console.error(format_error.error_message);
                }
            }

            var check = function(value, emit) {
                var values = {};
                var value_array = [];

                var i = 0;
                var current_component = null;
                var current_component_value = null;
                var component_index = -1;
                var error = false;
                while(i < value.length && !error){
                    component_index++;
                    current_component = format_array[component_index];
                    current_component_value = DateVal.date_components[current_component];

                    if(current_component_value===0){
                        //Expecting a particular delimiter
                        if(value[i]!==current_component){
                            error = true;
                            break;
                        } else {
                        	value_array.push(null);
                            i++;
                            continue;
                        }
                    }

                    var min = current_component_value[0];
                    var max = current_component_value[current_component_value.length-1];

                    var incremented = false;
                    var numeric_string = "";
                    for(var n = 0; n < max; n++){
                        var character = value[i + n];
                        if(character===undefined){
                            if(n<min){
                                error = true;
                            }
                            break;
                        }
                        var char_code = character.charCodeAt(0);
                        if(char_code < 48 || char_code > 57){
                            if(n===min){
                                //Stopped at min
                                break;
                            } else {
                                error = true;
                                break;
                            }
                        } else {
                            numeric_string+=character;
                        }
                    }
                    
                    i += n;

                    if(error){
                        break;
                    }

                    var int_val = parseInt(numeric_string);

                    value_array.push(numeric_string);

                    if(current_component==='yyyy' || current_component==='yy'){
                        values.year = int_val;
                    } else if(current_component==='MM' || current_component==='M'){
                        values.month = int_val;
                    } else if(current_component==='dd' || current_component==='d'){
                        values.day = int_val;
                    } else if(current_component==='hh' || current_component==='h'){
                        values.hour = int_val;
                    } else if(current_component==='mm' || current_component==='m'){
                        values.minute = int_val;
                    } else if(current_component==='ss' || current_component==='s'){
                        values.second = int_val;
                    }
                }

                if(error || component_index<format_array.length-1){
                    return FieldVal.create_error(DateVal.errors.invalid_date_format, flags);
                }

                if(values.hour!==undefined && (values.hour < 0 || values.hour>23)){
                	return FieldVal.create_error(DateVal.errors.invalid_date, flags);
                }
                if(values.minute!==undefined && (values.minute < 0 || values.minute>59)){
                	return FieldVal.create_error(DateVal.errors.invalid_date, flags);
                }
                if(values.second!==undefined && (values.second < 0 || values.second>59)){
                	return FieldVal.create_error(DateVal.errors.invalid_date, flags);
                }

                if(values.month!==undefined){
                    var month = values.month;
                    if(month>12){
                        return FieldVal.create_error(DateVal.errors.invalid_date, flags);
                    } else if(month<1){
                        return FieldVal.create_error(DateVal.errors.invalid_date, flags);
                    }

                    if(values.day){
                        var day = values.day;

                        if(day<1){
                            return FieldVal.create_error(DateVal.errors.invalid_date, flags);
                        }

                        if(values.year){
                            var year = values.year;
                            if(month==2){
                                if(year%400===0 || (year%100!==0 && year%4===0)){
                                    if(day>29){
                                        return FieldVal.create_error(DateVal.errors.invalid_date, flags);
                                    }
                                } else {
                                    if(day>28){
                                        return FieldVal.create_error(DateVal.errors.invalid_date, flags);
                                    }
                                }
                            }
                        }
        
                        if(month===4 || month===6 || month===9 || month===11){
                            if(day > 30){
                                return FieldVal.create_error(DateVal.errors.invalid_date, flags);
                            }
                        } else if(month===2){
                            if(day > 29){
                                return FieldVal.create_error(DateVal.errors.invalid_date, flags);
                            }
                        } else {
                            if(day > 31){
                                return FieldVal.create_error(DateVal.errors.invalid_date, flags);
                            }
                        }
                    }
                } else {
                    //Don't have month, but days shouldn't be greater than 31 anyway
                    if(values.day){
                        if(values.day > 31){
                            return FieldVal.create_error(DateVal.errors.invalid_date, flags);
                        } else if(values.day < 1){
                            return FieldVal.create_error(DateVal.errors.invalid_date, flags);
                        }
                    }
                }

                if(flags.emit){
                	if(flags.emit === DateVal.EMIT_COMPONENT_ARRAY){
                		emit(value_array);
                	} else if(flags.emit === DateVal.EMIT_OBJECT){
                        emit(values);
                    } else if(flags.emit === DateVal.EMIT_DATE){
                        var date = new Date(0);//Start with Jan 1st 1970
                        date.setUTCFullYear(0);

                        if(values.year!==undefined){
                            date.setYear(values.year);
                        }
                        if(values.month!==undefined){
                            date.setUTCMonth(values.month-1);
                        }
                        if(values.day!==undefined){
                            date.setUTCDate(values.day);
                        }
                        if(values.hour!==undefined){
                            date.setUTCHours(values.hour);
                        }
                        if(values.minute!==undefined){
                            date.setUTCMinutes(values.minute);
                        }
                        if(values.second!==undefined){
                            date.setUTCSeconds(values.second);
                        }

                        emit(date);
                    }
                }

                //SUCCESS
                return;
            };
            if(flags){
                flags.check = check;
                return flags;
            }
            return {
                check: check
            };
        }
    };

    //Constants used for emit settings
    DateVal.EMIT_COMPONENT_ARRAY = {};
    DateVal.EMIT_DATE = {};
    DateVal.EMIT_OBJECT = {};
    DateVal.EMIT_STRING = {};

    DateVal.date_components = {
        "yyyy": [4],
        "yy": [2],
        "MM": [2],
        "M": [1,2],
        "dd": [2],
        "d": [1,2],
        "hh": [2],
        "h": [1,2],
        "mm": [2],
        "m": [1,2],
        "ss": [2],
        "s": [1,2],
        " ": 0,
        "-": 0,
        "/": 0,
        ":": 0
    };

    return DateVal;
}).call();