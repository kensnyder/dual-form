"use strict";

var util = require('./util');

var validators = {
	gt: function(compareTo, message) {
		compareTo = parseFloat(compareTo);
		return function (value, result) {
			if (parseFloat(value) > compareTo) {
				return true;
			}
			return message || 'Field must be greater than ' + compareTo + '.';
		};
	},
	gte: function(compareTo, message) {
		compareTo = parseFloat(compareTo);
		return function (value, result) {
			if (parseFloat(value) >= compareTo) {
				return true;
			}
			return message || 'Field must be greater than or equal to ' + compareTo + '.';
		};
	},
	lt: function(compareTo, message) {
		compareTo = parseFloat(compareTo);
		return function (value, result) {
			if (parseFloat(value) < compareTo) {
				return true;
			}
			return message || 'Field must be less than ' + compareTo + '.';
		};
	},
	lte: function(compareTo, message) {
		compareTo = parseFloat(compareTo);
		return function (value, result) {
			if (parseFloat(value) <= compareTo) {
				return true;
			}
			return message || 'Field must be less than or equal to ' + compareTo + '.';
		};
	},
	between: function(min, max, message) {
		min = parseFloat(min);
		max = parseFloat(max);
		return function (value, result) {
			value = parseFloat(value);
			if (value >= min && value <= max) {
				return true;
			}
			return message || 'Field must be between ' + min + ' and ' + max + '.';
		};
	},
	checkedEq: function(compareTo, message) {
		compareTo = parseFloat(compareTo);
		return function (value, result) {
			if (value.length === compareTo) {
				return true;
			}
			return message || 'Exactly ' + compareTo + ' items must be selected.';
		};
	},		
	checkedGt: function(compareTo, message) {
		compareTo = parseFloat(compareTo);
		return function (value, result) {
			if (value.length > compareTo) {
				return true;
			}
			return message || 'More than ' + compareTo + ' items must be selected.';
		};
	},		
	checkedGte: function(compareTo, message) {
		compareTo = parseFloat(compareTo);
		return function (value, result) {
			if (value.length >= compareTo) {
				return true;
			}
			return message || 'At least ' + compareTo + ' items must be selected.';
		};
	},	
	checkedLt: function(compareTo, message) {
		compareTo = parseFloat(compareTo);
		return function (value, result) {
			if (value.length < compareTo) {
				return true;
			}
			return message || 'Fewer than ' + compareTo + ' items must be selected.';
		};
	},		
	checkedLte: function(compareTo, message) {
		compareTo = parseFloat(compareTo);
		return function (value, result) {
			if (value.length <= compareTo) {
				return true;
			}
			return message || 'No more than ' + compareTo + ' items may be selected.';
		};
	},		
	checkedBetween: function(min, max, message) {
		min = parseFloat(min);
		max = parseFloat(max);
		return function (value, result) {
			if (value.length <= max && value.length >= min) {
				return true;
			}
			return message || 'Between ' + min + ' and ' + max + ' items must be selected.';
		};
	},
	matchesField: function(otherInput, message) {
		return function(value, result) {
			if (value === otherInput.get()) {
				return true;
			}
			return message || 'Fields must match.';
		};
	},
	minLength: function(min, message) {
		return function (value, result) {
			if (typeof value == 'string' && value.length >= min) {
				return true;
			}
			return message || 'Value must be at least ' + min + ' characters.';
		};
	},
	maxLength: function(max, message) {
		max = parseFloat(max);
		return function (value, result) {
			if (typeof value == 'string' && value.length <= max) {
				return true;
			}
			return message || 'Value must be no more than ' + max + ' characters.';
		};
	},
	betweenLength: function(min, max, message) {
		min = parseFloat(min);
		max = parseFloat(max);
		return function (value, result) {
			if (typeof value == 'string' && value.length <= min && value.length >= max) {
				return true;
			}
			return message || 'Value must be between ' + min + ' and ' + max + ' characters.';
		};
	},
	required: function(message) {
		return function(value, result) {
			if (!!value) {
				return true;
			}
			return message || 'Field is required.';
		};
	},
	notEmpty: function(message) {
		return function(value, result) {
			value = util.castToString(value).trim();
			if (value.length > 0) {
				return true;
			}
			return message || 'Field cannot be empty.';
		};
	},
	regex: function(regex, message) {
		return function (value, result) {
			return util.castToString(value).match(regex) || message || 'Value in unexpected format.';
		};
	},
	email: function(message) {
		var regex = /\S+@\S/;
		return this.regex(regex, message || 'Email is invalid.');
	},
	numeric: function(message) {
		var regex = /^[\d,.-]+$/;
		return this.regex(regex, message || 'Value must be a number.');
	},
	integer: function(message) {
		var regex = /^\d+$/;
		return this.regex(regex, message || 'Value must be a whole number.');
	},
	alpha: function(message) {
		var regex = /^[a-z]+$/i;
		return this.regex(regex, message || 'Value must contain only letters.');
	},
	alphanumeric: function(message) {
		var regex = /^\d+$/;
		return this.regex(regex, message || 'Value must contain only numbers and letters.');
	},
	url: function(message) {
		var regex = /^https?:\/\/\w+\S*$/;
		return this.regex(regex, message || 'Value must be a valid URL.');
	}
};

module.exports = validators;