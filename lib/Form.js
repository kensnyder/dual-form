"use strict";

var _ = require('lodash');
var util = require('./util');
var Element = require('./Element');
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
		element.form = this;
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
		var values = {};
		this.elements.forEach(function(element) {
			var name = element.getName();
			var value;
			if (element instanceof Form.Checkbox) {
				if (!!element.attributes.checked) {
					value = element.get();
				}
			}
			else {
				value = element.get();
			}
			if (value === undefined) {
				return;
			}
			if ((name in values) && !Array.isArray(values[name])) {
				values[name] = [ values[name] ];
			}
			if (Array.isArray(values[name])) {
				values[name].push(value);
			}
			else {
				values[name] = value;
			}
		});
		return values;
	},
	validate: function() {
		var result = {
			valid: true,
			warnings: [],
			errors: []
		};
		return result;
	}
});

module.exports = Form;
