"use strict";

var util = require('../lib/util');

module.exports = {

	"nameToPath": function(test) {

		test.deepEqual(util.nameToPath("user[fname]"), ['user','fname'], '1 level');
		test.deepEqual(util.nameToPath("user[profile][fname]"), ['user','profile','fname'], '2 level');

		test.done();
	}
	,
	"diveSet on empty object": function(test) {
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
	,
	"diveSet with initial values": function(test) {
		var initial, expected;

		initial = {fname:'Alice'};
		expected = {fname:'Alice', lname:'Johnson'};
		test.deepEqual(util.diveSet(initial, ['lname'], 'Johnson'), expected, 'one level path');

		initial = {user: {fname:'Alice'}};
		expected = {user: {fname:'Alice', lname:'Johnson'}};
		test.deepEqual(util.diveSet(initial, ['user','lname'], 'Johnson'), expected, 'two level path');

		initial = {tags: [18]};
		expected = {tags: [18,24]};
		test.deepEqual(util.diveSet(initial, ['tags','[]'], 24), expected, 'explicit array path');

		initial = {tags: [18]};
		expected = {tags: [18,24]};
		test.deepEqual(util.diveSet(initial, ['tags'], 24), expected, 'implied array path');

		initial = {post: {tags: [18]}};
		expected = {post: {tags: [18,24]}};
		test.deepEqual(util.diveSet(initial, ['post','tags'], 24), expected, 'two level implied array path');

		test.done();
	}

};
