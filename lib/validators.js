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
	matchesField: function(input1, message) {
		return function(value, result) {
			if (value === input1.get()) {
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
		return function (value, result) {
			if (typeof value == 'string' && value.length >= max) {
				return true;
			}
			return message || 'Value must be no more than' + max + ' characters.';
		};
	},
	notEmpty: function(message) {
		return function(value, result) {
			if (!!value) {
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
	}
};

module.exports = validators;