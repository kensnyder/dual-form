"use strict";

var DOMParser = require('xmldom').DOMParser;
var Form = require('../src/dual-form');

function htmlToObject(html) {
	var doc = new DOMParser().parseFromString(html, 'text/html');
	//console.log('\n>>>\n', nodeToObject(doc.documentElement));
	return nodeToObject(doc.documentElement);
}
function nodeToObject(node) {
	var obj = {}, text, i, len;
	if (node.nodeType === 3) { // text node
		// trimming may produce technically incorrect results
		// but will work fine for our tests
		return { '#text': node.nodeValue.trim() };
	}
	obj.tagName = node.nodeName.toUpperCase();
	//obj.nodeType = node.nodeType;
	obj.childNodes = [];
	obj.attributes = {};
	if (node.hasChildNodes()) {
		for (i = 0, len = node.childNodes.length; i < len; i++) {
			if (node.childNodes[i].nodeType === 3 && node.childNodes[i].nodeValue.trim() === '') {
				// ignore whitespace text nodes
				continue;
			}
			obj.childNodes.push(nodeToObject(node.childNodes[i]));
		}
	}
	if (node.hasAttributes()) {
		for (i = 0, len = node.attributes.length; i < len; i++) {
			obj.attributes[node.attributes[i].name] = node.attributes[i].value;
		}
	}	
	return obj;
}


module.exports = {

	"htmlEqual method": function(test) {
		// sanity check
		test.strictEqual(typeof DOMParser, 'function', 'DOMParser required ok');
		// define method to compare that two html strings have the same structure
		// regardless of attribute order or whitespace
		test.constructor.prototype.htmlEqual = function(actual, expected, message) {
			return this.deepEqual( htmlToObject(actual), htmlToObject(expected), message);
		};
		test.htmlEqual('<div />', '<div></div>', "closing vs. self-closing");
		test.htmlEqual('<div id="2" attr="1"></div>', '<div attr="1" id="2"></div>', "attribute order shouldn't matter");
		test.htmlEqual('\n<div id="2" attr="1">\t </div>', '<div attr="1" id="2"></div>', "whitespace should be ignored");
		test.htmlEqual('<i><b>hello</b> friend</i>', '<i><b> hello </b> friend</i>', "nesting");

		test.done();
	}
	,
	"instantiation": function(test) {
		// sanity check
		test.strictEqual(typeof Form, 'function', 'required ok');
		// default form
		var form = new Form();
		test.strictEqual(form.attributes.action, "", 'default action is ""');
		test.strictEqual(form.attributes.method, "GET", 'default method is "GET"');
		// form with attributes
		form = new Form({
			action: '/submit',
			method: 'POST',
			enctype: 'foo',
			'data-whatever': 'bar'
		});
		test.strictEqual(form.attributes.action, "/submit");
		test.strictEqual(form.attributes.method, "POST");
		test.strictEqual(form.attributes.enctype, "foo");
		test.strictEqual(form.attributes['data-whatever'], "bar");

		test.done();
	}
	,
	"render form tag by itself": function(test) {
		var form = new Form();
		var expected = '<form action="" method="GET"></form>';
		test.htmlEqual(form.render(), expected, 'form tag with default values');
		test.done();
	}	
	,
	"add elements manually": function(test) {
		var expected;
		var form = new Form();
		// textarea
		form.elements.push(new Form.Textarea());
		expected = '<form action="" method="GET"><textarea /></form>';
		// + text input
		form.elements.push(new Form.Input());
		expected = '<form action="" method="GET"><textarea /><input type="text" /></form>';
		test.htmlEqual(form.render(), expected, 'textarea and text input');
		// + email input
		form.elements.push(new Form.Email());
		expected = '<form action="" method="GET"><textarea /><input type="text" /><input type="email" /></form>';
		test.htmlEqual(form.render(), expected, 'textarea and email input');

		test.done();
	}
	,
	"add()": function(test) {
		var expected;
		var form = new Form();
		// textarea
		form.add('ta', 'textarea');
		expected = '<form action="" method="GET"><textarea name="ta" id="Ta" /></form>';
		test.htmlEqual(form.render(), expected, 'textarea and email input');

		test.done();
	}

};
