"use strict";

var dualForm = require('../index');
var Form = dualForm.Form;

module.exports = {

	"basic": function(test) {
		var expected;
		var form = new Form();

		form.add('fname', 'input');
		form.set('fname', 'Alice');

		expected = {fname: 'Alice'};
		test.deepEqual(form.get(), expected, 'Single field');

		form.add('lname', 'input');
		form.set('lname', 'Williams')

		expected = {fname: 'Alice', lname: 'Williams'};
		test.deepEqual(form.get(), expected, '2 fields');

		test.done();
	}
	,
	"checkboxes with 3 checkbox elements": function(test) {
		var expected;
		var form = new Form();

		form.add('languages', 'checkboxes', {
			options: ['JavaScript','Typescript','Dart']
		});
		form.set('languages', ['JavaScript','Typescript']);

		expected = {"languages": ['JavaScript','Typescript']};
		test.deepEqual(form.get(), expected, 'Two options checked');

		test.done();
	}	
	,
	"3 checkbox elements": function(test) {
		var expected;
		var form = new Form();

		form.add('languages', 'checkbox', { value: 'JavaScript', label: 'JavaScript' });
		form.add('languages', 'checkbox', { value: 'Typescript', label: 'Typescript' });
		form.add('languages', 'checkbox', { value: 'Dart', label: 'Dart' });
		form.set('languages', ['JavaScript','Typescript']);

		expected = {"languages": ['JavaScript','Typescript']};
		test.deepEqual(form.get(), expected, 'Two options checked');

		test.done();
	}

};
