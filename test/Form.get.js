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

		test.done();
	}

};
