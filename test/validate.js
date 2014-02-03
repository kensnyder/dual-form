"use strict";

var dualForm = require('../index');
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
	,
	"custom validator - two matching fields": function(test) {
		var form, expected;
		form = new Form();

		form.add('account_password', 'password');
		form.add('repeat_password', 'password');
		function matches(input1, message) {
			return function(value, result) {
				if (value === input1.get()) {
					return true;
				}
				return message;
			};
		}
		form.set({
			account_password: 'password123',
			repeat_password: 'password123'
		});
		form.elements[1].addValidator(
			matches(form.elements[0], 'Password and Repeat Password must match.')
		);
		expected = {
			valid: true,
			warnings: [],
			errors: []
		};
		test.deepEqual(form.elements[1].validate(), expected, 'passwords match');

		form.set('repeat_password', 'password124');
		expected.errors.push({
			element: form.elements[1],
			message: 'Password and Repeat Password must match.'
		});
		expected.valid = false;
		test.deepEqual(form.elements[1].validate(), expected, "passwords don't match");

		test.done();
	}
	,
	"custom validator - checkboxes": function(test) {
		var form, expected;
		form = new Form();

		form.add('friends[]', 'checkboxes', {
			options: [
				{ value: 10, label: 'Alice'},
				{ value: 20, label: 'Bob'},
				{ value: 30, label: 'Eve'}
			]
		});
		var cboxes = form.elements[0];
		test.strictEqual(typeof cboxes.addValidator, 'function', "addValidator exists");
		test.strictEqual(typeof cboxes.validate, 'function', "validate exists");

		function oneOrMoreChecked(value, result) {
			if (value.length > 0) {
				return true;
			}
			return 'Check at least one friend.';
		}
		form.elements[0].addValidator(oneOrMoreChecked);
		expected = {
			valid: false,
			warnings: [],
			errors: [{
				element: form.elements[0],
				message: 'Check at least one friend.'
			}]
		};
		test.deepEqual(form.elements[0].validate(), expected, "none checked - expected one");

		form.elements[0].set([10,20]);
		expected.valid = true;
		expected.errors.shift();
		test.deepEqual(form.elements[0].validate(), expected, "two checked");
		test.done();
	}	
	,
	"built-in validators": function(test) {
		var input, expected;
		input = new Form.Input({name:'fname'});
		input.addValidator('required', 'First name is required.');

		expected = {
			valid: false,
			warnings: [],
			errors: [{
				element: input,
				message: 'First name is required.'
			}]
		};		
		test.deepEqual(input.validate(), expected, "required field missing");

		input.set('Alice');
		expected.valid = true;
		expected.errors = [];
		test.deepEqual(input.validate(), expected, "required field present");

		test.done();
	}

};
