"use strict";
// function extend() {
// 	for (var i = 0, len = arguments.length; i < len; i++) {
// 		for
// 	}
// }

var _ = require('lodash');

function HTMLElement() {}

HTMLElement.prototype = {
	construct: function(attrs) {
		this.attributes = {};
		this.setAttributes(attrs);
	},
	setAttribute: function(name, value) {
		this.attributes[name] = value;
		return this;
	},
	setAttributes: function(attrs) {
		for (var name in attrs) {
			if (attrs.hasOwnProperty(name)) {
				this.setAttribute(name, attrs[name]);
			}
		}
		return this;
	},
	removeAttribute: function(name) {
		delete this.attributes[name];
		return this;
	},
	getAttribute: function(name) {
		return this.attributes[name];
	},
	getAttributes: function() {
		return _.clone(this.attributes);
	},
	render: function() {
		return util.tag(this.tagName, this.attributes);
	}
};
HTMLElement.createElementClass = function(tagName, Parent, methods) {
	methods = methods || {};
	var ctor = function() {
		this.construct.apply(this, [].slice.call(arguments));
	};
	ctor.prototype = Object.create(Parent.prototype);
	ctor.prototype.tagName = tagName;
	ctor.prototype.constructor = ctor;
	ctor.prototype.callSuper = function() {
		var args = [].slice.call(arguments);
		var method = args.shift();
		return Parent.prototype[method].apply(this, args);
	};
	ctor.prototype.applySuper = function(method, args) {
		return Parent.prototype[method].apply(this, args);
	};
	if (methods.construct) {
		ctor.prototype.construct = (function(construct) {
			return function() {
				var args = [].slice.call(arguments);
				Parent.prototype.construct.apply(this, args);
				construct.apply(this, args);
			};
		})(methods.construct);
	}
	for (var name in methods) {
		if (!methods.hasOwnProperty(name) || name == 'construct') {
			continue;
		}
		ctor.prototype[name] = methods[name];
	}
	return ctor;
};
var Form = HTMLElement.createElementClass('form', HTMLElement, {
	construct: function() {
		if (!('action' in this.attributes)) {
			this.setAttribute('action', '');
		}
		if (!('method' in this.attributes)) {
			this.setAttribute('method', 'GET');
		}
		this.elements = [];
		this.data = {};
	},
	render: function() {
		return util.tag('form', this.attributes) + this.renderElements() + util.tag('/form');
	},
	getElement: function(name) {
		
	},
	renderElements: function() {
		return this.elements.map(function(element) {
			return element.render();
		}).join('');
	},
	add: function(name, type, attrs) {
		type = type || 'input';
		var ElementClass = Form[type.slice(0,1).toUpperCase() + type.slice(1)];
		if (!ElementClass) {
			throw new Error('[dual-form] Form Element Class for type `' + type + '` not found.');
		}
		var element = new ElementClass(attrs);
		element.attributes.name = name;
		this.elements.push(element);
		return element;
	},
	set: function(name, value) {
		var pos = 0, i = 0, element, path, resolvedValue, copy;
		if (typeof name == 'object') {
			// set from object
			Object.keys(name).forEach(function(key) {
				this.set(key, name[key]);
			}, this);
			return this;
		}
		if (Array.isArray(value)) {
			// usual case of setting a string
			while ((element = this.elements[i++]) && value.length) {
				if (
					name === element.attributes.name 
					|| name + '[]' === element.attributes.name
					|| name + '[' + pos + ']'
				) {
					pos++;
					element.set(value.shift());
				}
			}
			return this;
		}
		else if (typeof value == 'object') {
			// make a copy of the value
			copy = {};
			copy[name] = _.clone(value);
			while ((element = this.elements[i++])) {
				path = util.nameToPath(element.attributes.name);
				resolvedValue = util.dive(copy, path);
				if (resolvedValue !== undefined) {
					element.set(resolvedValue);
				}
			}
			return this;
		}
		else {
			// usual case of setting a string
			while ((element = this.elements[i++])) {
				if (name === element.attributes.name) {
					element.set(value);
					return this;
				}
			}
		}
	},
	get: function() {
		// TODO: port jQuery serialize
		// var values = [];
		// this.elements.forEach(function(element) {
		// 	if (element instanceof Form.Radio) {
		// 		if (!!element.attributes.selected) {
		// 			values.push(element.get());
		// 		}
		// 	}
		// 	else if (element instanceof Form.Checkbox) {
		// 		if (!!element.attributes.checked) {
		// 			values.push(element.get());
		// 		}
		// 	}
		// 	else {
		// 		values.push
		// 	}
		// });
	}
});
Form.Element = HTMLElement.createElementClass('element', HTMLElement, {
	construct: function() {
		this.value = util.castToString(this.attributes.value);		
	},
	set: function(value) {
		this.value = util.castToString(value);
		return this;
	}
});
Form.Textarea = HTMLElement.createElementClass('textarea', Form.Element, {
	render: function() {
		var attrs = this.getAttributes();
		delete attrs.value;
		return util.tag('textarea', attrs) + util.esc(this.value) + util.tag('/textarea');
	}
});
Form.Input = HTMLElement.createElementClass('input', Form.Element, {
	construct: function() {
		this.attributes.type = 'text';		
	},
	set: function(value) {
		this.attributes.value = util.castToString(value);
		return this;
	},
	get: function() {
		return this.attributes.value;
	},
	render: function() {
		return util.tag('input', this.attributes);
	}
});
Form.Email = HTMLElement.createElementClass('input', Form.Input, {
	construct: function() {
		this.attributes.type = 'email';
	}
});
Form.Checkbox = HTMLElement.createElementClass('input', Form.Input, {
	construct: function() {
		this.attributes.type = 'checkbox';
	},
	set: function(value) {
		this.attributes.checked = (value === this.attributes.value ? 'checked' : undefined);
	}
});
Form.Radio = HTMLElement.createElementClass('input', Form.Checkbox, {
	construct: function() {
		this.attributes.type = 'radio';
	},
	set: function(value) {
		this.attributes.selected = (value === this.attributes.value ? 'selected' : undefined);
	}
});
Form.Option = HTMLElement.createElementClass('option', Form.Element, {
	construct: function() {
		this.text = util.castToString(this.attributes.text);
		delete this.attributes.text;
	},
	render: function() {
		this.attributes.value = this.value;
		return util.tag('option', this.attributes) + this.text + util.tag('/option');
	}
});
Form.Select = HTMLElement.createElementClass('select', Form.Element, {
	construct: function() {
		this.options = [];
		if (Array.isArray(this.attributes.options)) {
			this.attributes.options.forEach(function(option) {
				this.addOption(option);
			}, this);
		}
		delete this.attributes.options;
	},	
	addOption: function(option) {
		if (!(option instanceof Form.Option)) {
			option = new Form.Option(option);
		}
		this.options.push(option);
		return this;
	},
	render: function() {
		return util.tag('select', this.attributes) + this.renderOptions() + util.tag('/select');
	},
	renderOptions: function() {
		return this.options.map(function(option) {
			return option.render();
		}).join('');
	},
	set: function(value) {
		var i = 0, option;
		if (Array.isArray(value)) {
			// multi select
			while ((option = this.options[i++])) {
				if (value.indexOf(option.value) > -1) {
					option.attributes.selected = 'selected';
				}
				else {
					delete option.attributes.selected;
				}
			}
		}
		else {
			// regular select
			value = util.castToString(value);
			while ((option = this.options[i++])) {
				if (option.value == value) {
					option.attributes.selected = 'selected';
					break;
				}
			}
		}
		return this;
	}
});

var util = {
	tag: function(tagName, attrs) {
		attrs = attrs || {};
		if (!('id' in attrs) && !!attrs.name) {
			attrs.id = util.castToString(attrs.name).replace(/(?:^|\W+)([a-z])/g, function($0, $1) {
				return $1.toUpperCase();
			}).replace(/\W/g, '');
		}
		var html = '<' + tagName + util.attr(attrs) + '>';
		return html;
	},
	attr: function(attrs) {
		var out = '';
		for (var p in attrs || {}) {
			if (
				attrs.hasOwnProperty(p) 
				&& p != 'tagName' 
				&& p != 'tag' 
				&& typeof attrs[p] != 'function' 
				&& typeof attrs[p] != 'undefined' 
				&& p != 'wrapper'
			) {
				out += ' ' + util.esc(p) + '="' + util.esc(attrs[p]) + '"'; 
			}
		}
		return out;
	},
	nameToPath: function(name) {
		return name.
			replace(/\[(\w+)\]/g, '.$1.').
			replace(/\.{2,}/g, '.').
			replace(/\.$/, '').
			split('.')
		;
	},
	dive: function(data, path) {
		var attr;
		while (path.length > 0 && data !== undefined) {
			attr = path.shift();
			data = data[attr];
			if (Array.isArray(data) && path[0] == '[]') {
				return data.shift();
			}
		}
		return data;
	},
	castToString: function(s) {
		return (s === false || s === null || s === undefined ? '' : '' + s);
	},
	escapeChars: {
	  "&": "&amp;",
	  "<": "&lt;",
	  ">": "&gt;",
	  '"': "&quot;",
	  "'": "&#x27;"
	},
	esc: function(text) {
		return util.castToString(text).replace(/[&<>"']/g, function($0) {
			return util.escapeChars[$0];
		});
	}
};

module.exports = {
	Form: Form,
	HTMLElement: HTMLElement,
	util: util
};