"use strict";
// function extend() {
// 	for (var i = 0, len = arguments.length; i < len; i++) {
// 		for
// 	}
// }

var _ = require('lodash');

var uid = 0;

var util = {
	getUid: function() {
		return uid++;
	},
	generateId: function(fromName) {
		return util.castToString(fromName).replace(/(?:^|\W+)([a-z])/g, function($0, $1) {
			return $1.toUpperCase();
		}).replace(/\W/g, '');
	},
	tag: function(tagName, attrs) {
		attrs = attrs || {};
		if (!('id' in attrs) && !!attrs.name) {
			attrs.id = util.generateId(attrs.name);
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
	},
	createClass: function(Parent, methods) {
		methods = methods || {};
		var ctor = function() {
			this.construct.apply(this, [].slice.call(arguments));
		};
		ctor.prototype = Object.create(Parent.prototype);
		ctor.prototype.constructor = ctor;
		ctor.prototype.callSuper = function() {
			var args = [].slice.call(arguments);
			var method = args.shift();
			return Parent.prototype[method].apply(this, args);
		};
		ctor.prototype.applySuper = function(method, args) {
			return Parent.prototype[method].apply(this, args);
		};
		ctor.subclass = function(methods) {
			return util.createClass(ctor, methods);
		};	
		if (methods.construct) {
			if (Parent.prototype.construct) {				
				ctor.prototype.construct = (function(construct) {
					return function() {
						var args = [].slice.call(arguments);
						Parent.prototype.construct.apply(this, args);
						construct.apply(this, args);
					};
				})(methods.construct);
			}
			else {
				ctor.prototype.construct = methods.construct;
			}
		}
		for (var name in methods) {
			if (!methods.hasOwnProperty(name) || name == 'construct') {
				continue;
			}
			ctor.prototype[name] = methods[name];
		}
		return ctor;
	}
};

var Base = util.createClass(Object);

var Element = Base.subclass({
	tagName: 'element',
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
		return util.tag(this.tagName, this.attributes) + 
			util.esc(this.innerHTML) + 
			util.tag('/' + this.tagName)
		;
	},
	getId: function() {
		if (!this.attributes.id) {
			if (!!this.attributes.name) {
				this.attributes.id = util.generateId(this.attributes.name);
			}
			else {
				this.attributes.id = 'Element' + util.getUid();
			}
		}
		return this.attributes.id;
	}
});
// (function(subclass) {
// 	Element.subclass = function(tagName, methods) {
// 		subclass(ctor)
// 	};
// })(Element.subclass);
// Element.subclass = function(tagName, Parent, methods) {
// 	if (arguments.length == 2) {
// 		methods = Parent;
// 		Parent = Element;
// 	}
// 	var ctor = Base.createClass(Parent, methods);
// 	ctor.prototype.tagName = tagName;
// 	ctor.subclass = function(tagName, methods) {
// 		return Element.subclass(tagName, ctor, methods);
// 	};	
// 	return ctor;
// };
var Form = Element.subclass({
	tagName: 'form',
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
	find: function(name) {

	},
	render: function() {
		return util.tag('form', this.attributes) + this.renderElements() + util.tag('/form');
	},
	renderElements: function() {
		return this.elements.map(function(element) {
			var html = element.render();
			if (element.decorator) {
				html = element.decorator(element, html);
			}
			return html;
		}).join('');
	},
	add: function(name, type, attrs) {
		type = type || 'input';
		var ElementClass = Form[type.slice(0,1).toUpperCase() + type.slice(1)];
		if (!ElementClass) {
			throw new Error('[dual-form] Form Element Class for type `' + type + '` not found.');
		}
		attrs = _.clone(attrs || {});
		attrs.name = name;
		var element = new ElementClass(attrs);
		this.elements.push(element);
		return element;
	},
	set: function(name, value) {
		var pos = 0, i = 0, element, path, resolvedValue, copy, elName;
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
				elName = element.getName();
				if (
					name === elName
					|| name + '[]' === elName
					|| name + '[' + pos + ']'
				) {
					if (element instanceof Form.ElementList) {
						element.set(value);
					}
					else {						
						pos++;
						element.set(value.shift());
					}
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
Form.decorators = {};
Form.decorators.none = function(element, html) {
	return html;
};
Form.decorators.checkboxLabelBr = function(checkbox, html) {
	if (checkbox.label) {
		html += ' ' + checkbox.label.render() + '<br>';
	}
	return html;
};
Form.Element = Element.subclass({
	tagName: 'element',
	decorator: Form.decorators.none,
	construct: function() {
		this.value = util.castToString(this.attributes.value);		
	},
	set: function(value) {
		this.value = util.castToString(value);
		return this;
	},
	getName: function() {
		return this.getAttribute('name');
	}
});
Form.Textarea = Form.Element.subclass({
	tagName: 'textarea',
	render: function() {
		var attrs = this.getAttributes();
		delete attrs.value;
		return util.tag('textarea', attrs) + util.esc(this.value) + util.tag('/textarea');
	}
});
Form.Input = Form.Element.subclass({
	tagName: 'input',
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
Form.Email = Form.Input.subclass({
	construct: function() {
		this.attributes.type = 'email';
	}
});
Form.Label = Element.subclass({
	tagName: 'label',
	construct: function() {
		if (this.attributes.label) {
			this.innerHTML = this.attributes.label;
			delete this.attributes.label;
		}
	}
});
Form.Checkbox = Form.Input.subclass({
	decorator: Form.decorators.checkboxLabelBr,
	construct: function() {
		this.attributes.type = 'checkbox';
		if (this.attributes.label) {
			this.setLabel(this.attributes.label);
			delete this.attributes.label;
		}
	},
	setAttribute: function(name, value) {
		//this.callSuper('setAttribute', name, value);
		Form.Input.prototype.setAttribute.call(this, name, value);
		if (name === 'id' && this.label) {
			this.label.setAttribute('for', this.getId());
		}
		return this;
	},
	setLabel: function(label) {
		if (!(label instanceof Form.Label)) {
			label = new Form.Label(typeof label == 'string' ? {label:label} : label);
		}
		this.label = label;
		this.label.setAttribute('for', this.getId());
		return this;
	},
	set: function(value) {
		this.attributes.checked = (value === this.attributes.value ? 'checked' : undefined);
		return this;
	},
	check: function(toState) {
		this.attributes.checked = toState ? "checked" : undefined;
		return this;
	}
});
Form.ElementList = Base.subclass({
	construct: function(params) {
		this.name = params.name;
		this.elements = [];
	},
	getName: function() {
		return this.name;
	},
	get: Form.prototype.get,
	find: Form.prototype.find,
	add: Form.prototype.add,
	renderElements: Form.prototype.renderElements,
	render: Form.prototype.renderElements
});
Form.Checkboxes = Form.ElementList.subclass({
	memberClass: Form.Checkbox,
	construct: function(params) {
		if (Array.isArray(params.options)) {
			params.options.forEach(function(checkbox) {
				this.addOption(checkbox);
			}, this);
		}
	},
	set: function(name, values) {
		if (arguments.length == 2 && name != this.name) {
			return this;
		}
		if (arguments.length == 1) {
			values = name;
		}
		if (!Array.isArray(values)) {
			values = [values];
		}
		this.elements.forEach(function(checkbox) {
			var isInArray = values.indexOf(checkbox.get()) > -1;
			checkbox.check(isInArray);
		});
		return this;
	},	
	addOption: function(checkbox) {
		if (!(checkbox instanceof this.memberClass)) {
			checkbox = new this.memberClass(checkbox);
		}
		checkbox.setAttribute('name', this.name);
		this.elements.push(checkbox);
	}
});
Form.Radio = Form.Checkbox.subclass({
	construct: function() {
		this.attributes.type = 'radio';
	}
});
Form.Radios = Form.Checkboxes.subclass({
	memberClass: Form.Radio,
});
Form.Option = Form.Element.subclass({
	tagName: 'option',
	construct: function() {
		this.text = util.castToString(this.attributes.text);
		delete this.attributes.text;
	},
	render: function() {
		this.attributes.value = this.value; // TODO use setAttribute to keep in sync?
		return util.tag('option', this.attributes) + this.text + util.tag('/option');
	}
});
Form.Select = Form.Element.subclass({
	tagName: 'select',
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

module.exports = {
	Form: Form,
	Element: Element,
	util: util
};