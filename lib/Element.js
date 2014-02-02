"use strict";

var _ = require('lodash');
var util = require('./util');
var Base = require('./Base');
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
				this.attributes.id = 'FormElement' + util.getUid();
			}
		}
		return this.attributes.id;
	}
});

module.exports = Element;