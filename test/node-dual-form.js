"use strict";

var DOMParser = require('xmldom').DOMParser;
var Form = require('../src/dual-form');

function htmlToObject(html) {
	var doc = new DOMParser({
		errorHandler:{warning:function(){}}
	}).parseFromString(html, 'text/html');
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

	"htmlEqual() and notHtmlEqual() methods": function(test) {
		// sanity check
		test.strictEqual(typeof DOMParser, 'function', 'DOMParser required ok');
		// define method to compare that two html strings have the same structure
		// regardless of attribute order or whitespace
		test.constructor.prototype.htmlEqual = function(actual, expected, message) {
			return this.deepEqual( htmlToObject(actual), htmlToObject(expected), message);
		};		
		test.constructor.prototype.notHtmlEqual = function(actual, expected, message) {
			return this.notDeepEqual( htmlToObject(actual), htmlToObject(expected), message);
		};
		test.htmlEqual('<div />', '<div></div>', "closing vs. self-closing");
		test.htmlEqual('<div id=2 attr="1"></div>', '<div attr="1" id="2"></div>', "attribute order shouldn't matter");
		test.htmlEqual('\n<div id="2" attr="1">\t </div>', '<div attr="1" id="2"></div>', "whitespace should be ignored");
		test.htmlEqual('<i><b>hello</b> friend</i>', '<i><b> hello </b> friend</i>', "nesting");
		// trees produced by htmlToObject for attributes with no values
		var regular = htmlToObject('<input />');
		var readonly = htmlToObject('<input readonly />');
		test.notDeepEqual(regular, readonly, 'different trees');
		test.strictEqual('readonly' in regular.attributes, false, 'does not have attribute');
		test.strictEqual('readonly' in readonly.attributes, true, 'has attribute');
		// notHTMLEqual
		test.notHtmlEqual('<input />','<input checked />','notHtmlEqual()');

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
		expected = 
			'<form action="" method="GET">\
				<textarea />\
			</form>';
		// + text input
		form.elements.push(new Form.Input());
		expected = 
			'<form action="" method="GET">\
				<textarea />\
				<input type="text" value="" />\
			</form>';
		test.htmlEqual(form.render(), expected, 'textarea and text input');
		// + email input
		form.elements.push(new Form.Email());
		expected = 
			'<form action="" method="GET">\
				<textarea />\
				<input type="text" value="" />\
				<input type="email" value="" />\
			</form>';
		test.htmlEqual(form.render(), expected, 'textarea and email input');

		test.done();
	}
	,
	"add()": function(test) {
		var expected;
		var form = new Form();
		// textarea
		form.add('data[ta]', 'textarea');
		expected = 
			'<form action="" method="GET">\
				<textarea name="data[ta]" id="DataTa" />\
			</form>';
		test.htmlEqual(form.render(), expected, 'textarea');
		// textarea 2
		form = new Form();
		form.add('ta', 'textarea', {id:'foo'});
		expected = 
			'<form action="" method="GET">\
				<textarea name="ta" id="foo" />\
			</form>';
		test.htmlEqual(form.render(), expected, 'textarea with attributes');

		test.done();
	}	
	,
	"set()": function(test) {
		var expected;
		var form = new Form();
		// textarea
		form = new Form();
		form.add('ta', 'textarea', {id:undefined});
		form.set('ta', '5')
		test.strictEqual(form.elements[0].value, '5', 'value properly set');
		expected = 
			'<form action="" method="GET">\
				<textarea name="ta">5</textarea>\
			</form>';
		test.htmlEqual(form.render(), expected, 'value properly rendered');

		test.done();
	}	
	,
	"set() with arrays": function(test) {
		var expected;
		var form = new Form();
		// inputs
		form = new Form();
		form.add('tags[]', 'input', {id:undefined});
		form.add('tags[]', 'input', {id:undefined});
		form.set('tags', ['one','two']);
		expected = 
			'<input type=text name="tags[]" value="one">\
			<input type=text name="tags[]" value=two>';
		test.htmlEqual(form.renderElements(), expected, 'setting values from array');

		test.done();
	}	
	,
	"set() with objects": function(test) {
		var expected;
		var form = new Form();
		// inputs
		form = new Form();
		form.add('user[fname]', 'input', {id:undefined});
		form.add('user[lname]', 'input', {id:undefined});
		form.set('user', {fname:'John', lname:'Doe'});
		expected = 
			'<input type=text name="user[fname]" value="John">\
			<input type=text name="user[lname]" value=Doe>';
		test.htmlEqual(form.renderElements(), expected, 'setting values from object');
		// one arg
		form.set({user: {fname:'Jennifer', lname:'Williams'}});
		expected = 
			'<input type=text name="user[fname]" value="Jennifer">\
			<input type=text name="user[lname]" value=Williams>';
		test.htmlEqual(form.renderElements(), expected, 'set() with one object arg');

		test.done();
	}	
	,
	"set() with objects and arrays": function(test) {
		var expected;
		var form = new Form();
		// inputs
		form = new Form();
		form.add('user[name]', 'input', {id:undefined});
		form.add('user[faves][]', 'input', {id:undefined});
		form.add('user[faves][]', 'input', {id:undefined});
		form.set({user: {name:'Ralph', faves: ['a','b']}});
		expected = 
			'<input type=text name="user[name]" value="Ralph">\
			<input type=text name="user[faves][]" value=a>\
			<input type=text name="user[faves][]" value=b>';
		test.htmlEqual(form.renderElements(), expected, 'set() with one object arg');

		test.done();
	}	
	,
	"checkboxes": function(test) {
		var expected;
		var form = new Form();
		// inputs
		form.add('tag[]', 'checkbox', {id:undefined, value:5});
		form.add('tag[]', 'checkbox', {id:undefined, value:16});
		expected = 
			'<input type=checkbox name="tag[]" value="5">\
			<input type=checkbox name="tag[]" value="16">';
		test.htmlEqual(form.renderElements(), expected, 'checkboxes');
		// check a checkbox
		form.set('tag', [16]);
		expected = 
			'<input type=checkbox name="tag[]" value="5">\
			<input type=checkbox name="tag[]" value="16" checked="checked">';
		test.htmlEqual(form.renderElements(), expected, 'checkboxes');
		// nested object
		form = new Form();
		form.add('data[tag][]', 'checkbox', {id:undefined, value:5});
		form.add('data[tag][]', 'checkbox', {id:undefined, value:16});
		form.set({data: {tag: [5]}});
		expected = 
			'<input type=checkbox name="data[tag][]" value="5" checked="checked">\
			<input type=checkbox name="data[tag][]" value="16">';
		test.htmlEqual(form.renderElements(), expected, 'checkboxes');

		test.done();
	}	
	,
	"radio buttons": function(test) {
		var expected;
		var form = new Form();
		// select a radio
		form.add('category', 'radio', {id:undefined, value:5});
		form.add('category', 'radio', {id:undefined, value:16});		
		form.set('category', 16);
		expected = 
			'<input type=radio name="category" value="5">\
			<input type=radio name="category" value="16" selected="selected">';
		test.htmlEqual(form.renderElements(), expected, 'checkboxes');

		test.done();
	}	
	,
	"select": function(test) {
		var expected;
		var form = new Form();
		// select a radio
		form.add('location', 'select', {
			id: undefined, 
			options: [
				{ value: 29, text: 'Hilldale'},
				{ value: 18, text: 'Springfield'}
			]
		});
		form.set('location', 29);
		expected = 
			'<select name="location">\
				<option value="29" selected="selected">Hilldale</option>\
				<option value="18">Springfield</option>\
			</select>';
		test.htmlEqual(form.renderElements(), expected, 'simple select');

		test.done();
	}

};
