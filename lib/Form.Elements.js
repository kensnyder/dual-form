"use strict";

var _ = require('lodash');
var util = require('./util');
var Base = require('./Base');
var Element = require('./Element');
var Form = require('./Form');

var elements = {};
elements.FormElement = Element.subclass({
	decorator: Form.decorators.none,
	construct: function() {
		this.validators = []; 
		this.value = util.castToString(this.attributes.value);		
	},
	set: function(value) {
		this.value = util.castToString(value);
		return this;
	},
	getName: function() {
		return this.getAttribute('name');
	},
	validate: function(result) {
		result = result || {
			warnings: [],
			errors: []
		};
		var valid = true;
		this.validators.forEach(function(validator) {
			var outcome = validator.call(this, this.get(), result);			
			if (outcome === false) {
				valid = false;
			}
			else if (typeof outcome == 'string') {
				result.errors.push({
					element: this,
					message: outcome
				});
				valid = false;
			}
			else if (typeof outcome == 'object') {
				outcome.element = this;
				result.errors.push(outcome);
			}
		}, this);
		result.valid = valid;
		return result;
	},
	addValidator: function(validator) {
		this.validators.push(validator);
		return this;
	}
});
elements.Textarea = elements.FormElement.subclass({
	tagName: 'textarea',
	render: function() {
		var attrs = this.getAttributes();
		delete attrs.value;
		return util.tag('textarea', attrs) + util.esc(this.value) + util.tag('/textarea');
	}
});
elements.Input = elements.FormElement.subclass({
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
elements.Email = elements.Input.subclass({
	construct: function() {
		this.attributes.type = 'email';
	}
});
elements.Password = elements.Input.subclass({
	construct: function() {
		this.attributes.type = 'password';
	}
});
elements.Label = Element.subclass({
	tagName: 'label',
	construct: function() {
		if (this.attributes.label) {
			this.innerHTML = this.attributes.label;
			delete this.attributes.label;
		}
	}
});
elements.Checkbox = elements.Input.subclass({
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
		elements.Input.prototype.setAttribute.call(this, name, value);
		if (name === 'id' && this.label) {
			this.label.setAttribute('for', this.getId());
		}
		return this;
	},
	setLabel: function(label) {
		if (!(label instanceof elements.Label)) {
			label = new elements.Label(typeof label == 'string' ? {label:label} : label);
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
elements.ElementList = Base.subclass({
	construct: function(params) {
		this.name = params.name;
		this.elements = [];
		this.validators = [];
	},
	getName: function() {
		return this.name;
	},
	validate: elements.FormElement.prototype.validate,
	addValidator: elements.FormElement.prototype.addValidator,
	get: Form.prototype.get,
	find: Form.prototype.find,
	add: Form.prototype.add,
	renderElements: Form.prototype.renderElements,
	render: Form.prototype.renderElements
});
elements.Checkboxes = elements.ElementList.subclass({
	memberClass: elements.Checkbox,
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
elements.Radio = elements.Checkbox.subclass({
	construct: function() {
		this.attributes.type = 'radio';
	}
});
elements.Radios = elements.Checkboxes.subclass({
	memberClass: elements.Radio,
});
elements.Option = elements.FormElement.subclass({
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
elements.Select = elements.FormElement.subclass({
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
		if (!(option instanceof elements.Option)) {
			option = new elements.Option(option);
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

module.exports = elements;
