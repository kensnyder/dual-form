"use strict";

var dualForm = require('../src/dual-form');
var Form = dualForm.Form;

module.exports = {

	"form validate with no constraints": function(test) {
		test.strictEqual(typeof Form.prototype.validate, 'function', 'validate() function exists');
		
		var form = new Form();
		form.add('fname', 'input');
		var result = form.validate();
		test.strictEqual(result.valid, true, 'valid');
		test.deepEqual(result.warnings, [], 'warnings empty');
		test.deepEqual(result.errors, [], 'errors empty');

		test.done();
	}
	,
	"input validate with no constraints": function(test) {
		var form = new Form();

		var input = new Form.Input({name:'fname'});
		test.strictEqual(typeof input.validate, 'function', 'Form.Input.validate() function exists');
		
		var result = input.validate();
		test.strictEqual(result.valid, true, 'valid');
		test.deepEqual(result.warnings, [], 'warnings empty');
		test.deepEqual(result.errors, [], 'errors empty');

		test.done();
	}
	,
	"custom validators": function(test) {
		var form, input, result, expected;
		form = new Form();

		input = new Form.Input({name:'fname'});
		test.strictEqual(typeof input.addValidator, 'function', 'addValidator() function exists');
		
		function notEmpty(value, result) {
			if (!!value) {
				return true;
			}
			return 'Field cannot be empty.';
		}
		input.addValidator(notEmpty);

		result = input.validate();
		test.strictEqual(result.valid, false, 'empty string not valid');

		input.set('0');
		result = input.validate();
		test.strictEqual(result.valid, true, '"0" is valid');

		input.set('');
		expected = {
			valid: false,
			warnings: [],
			errors: [{
				element: input,
				message: 'Field cannot be empty.'
			}]
		};
		test.deepEqual(input.validate(), expected, 'error message');
		function gtZero(value, result) {
			if (parseFloat(value) > 0) {
				return true;
			}
			return 'Value must be greater than zero.'
		}
		input.addValidator(gtZero);
		expected.errors.push({
			element: input,
			message: 'Value must be greater than zero.'
		});

		test.deepEqual(input.validate(), expected, '"" is not greater than zero');

		input.set('0');
		expected.errors.shift();
		test.deepEqual(input.validate(), expected, '"0" is not greater than zero');

		input.set('-1');
		test.deepEqual(input.validate(), expected, '"-1" is not greater than zero');

		input.set('1');
		expected.valid = true;
		expected.errors.shift();
		test.deepEqual(input.validate(), expected, '"1" is greater than zero');

		function minLength(length) {
			return function (value, result) {
				if (typeof value == 'string' && value.length >= length) {
					return true;
				}
				return 'Value must be at least ' + length + ' characters.'
			};
		}
		input.addValidator(minLength(2));
		expected.errors.push({
			element: input,
			message: 'Value must be at least 2 characters.'
		});
		expected.valid = false;
		test.deepEqual(input.validate(), expected, '"1" is not long enough');

		input.set('12');
		expected.valid = true;
		expected.errors.shift();
		test.deepEqual(input.validate(), expected, '"12" is long enough');

		test.done();
	}

};
