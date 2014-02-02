"use strict";

var util = require('../lib/util');

module.exports = {

	"nameToPath": function(test) {

		test.deepEqual(util.nameToPath("user[fname]"), ['user','fname'], '1 level');
		test.deepEqual(util.nameToPath("user[profile][fname]"), ['user','profile','fname'], '2 level');

		test.done();
	}
	,
	"diveSet": function(test) {
		var expected;

		test.strictEqual(typeof util.diveSet, 'function', 'function exists');

		expected = {fname:'Alice'};
		test.deepEqual(util.diveSet({}, ['fname'], 'Alice'), expected, 'one level path');

		expected = {user: {fname:'Alice'}};
		test.deepEqual(util.diveSet({}, ['user','fname'], 'Alice'), expected, 'two level path');

		expected = {tags: [18]};
		test.deepEqual(util.diveSet({}, ['tags','[]'], 18), expected, 'array path');

		test.done();
	}

};
