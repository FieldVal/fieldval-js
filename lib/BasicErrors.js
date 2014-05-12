module.exports = {
    too_short: function(min_len) {
        return {
            error: 100,
            error_message: "Length is less than " + min_len
        }
    },
    too_long: function(max_len) {
        return {
            error: 101,
            error_message: "Length is greater than " + max_len
        }
    },
    too_small: function(min_val) {
        return {
            error: 102,
            error_message: "Value is less than " + min_val
        }
    },
    too_large: function(max_val) {
        return {
            error: 103,
            error_message: "Value is greater than " + max_val
        }
    },
    not_in_list: function() {
        return {
            error: 104,
            error_message: "Value is not in the allowed list"
        }
    },
    cannot_be_empty: function() {
        return {
            error: 105,
            error_message: "Value cannot be empty."
        }
    },
    no_prefix: function(prefix) {
        return {
            error: 106,
            error_message: "Value does not have prefix: " + prefix
        }
    }
}