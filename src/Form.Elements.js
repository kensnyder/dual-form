"use strict";

var _ = require('lodash');
var util = require('./util');
var Base = require('./Base');
var Element = require('./Element');
var Form = require('./Form');

Form.Element = Element.subclass({
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
Form.Password = Form.Input.subclass({
	construct: function() {
		this.attributes.type = 'password';
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

Form.validators = {
	gt: function(compareTo, message) {
		compareTo = parseFloat(compareTo);
		return function (value, result) {
			if (parseFloat(value) > compareTo) {
				return true;
			}
			return message || 'Field must be greater than ' + compareTo + '.';
		};
	},
	gte: function(compareTo, message) {
		compareTo = parseFloat(compareTo);
		return function (value, result) {
			if (parseFloat(value) >= compareTo) {
				return true;
			}
			return message || 'Field must be greater than or equal to ' + compareTo + '.';
		};
	},
	lt: function(compareTo, message) {
		compareTo = parseFloat(compareTo);
		return function (value, result) {
			if (parseFloat(value) < compareTo) {
				return true;
			}
			return message || 'Field must be less than ' + compareTo + '.';
		};
	},
	lte: function(compareTo, message) {
		compareTo = parseFloat(compareTo);
		return function (value, result) {
			if (parseFloat(value) <= compareTo) {
				return true;
			}
			return message || 'Field must be less than or equal to ' + compareTo + '.';
		};
	},
	between: function(min, max, message) {
		min = parseFloat(min);
		max = parseFloat(max);
		return function (value, result) {
			value = parseFloat(value);
			if (value >= min && value <= max) {
				return true;
			}
			return message || 'Field must be between ' + min + ' and ' + max + '.';
		};
	},
	matchesField: function(input1, message) {
		return function(value, result) {
			if (value === input1.get()) {
				return true;
			}
			return message || 'Fields must match.';
		};
	},
	minLength: function(min, message) {
		return function (value, result) {
			if (typeof value == 'string' && value.length >= min) {
				return true;
			}
			return message || 'Value must be at least ' + min + ' characters.';
		};
	},
	maxLength: function(max, message) {
		return function (value, result) {
			if (typeof value == 'string' && value.length >= max) {
				return true;
			}
			return message || 'Value must be no more than' + max + ' characters.';
		};
	},
	notEmpty: function(message) {
		return function(value, result) {
			if (!!value) {
				return true;
			}
			return message || 'Field cannot be empty.';
		};
	},
	regex: function(regex, message) {
		return function (value, result) {
			return util.castToString(value).match(regex) || message || 'Value in unexpected format.';
		};
	},
	email: function(message) {
		var regex = /\S+@\S/;
		return this.regex(regex, message || 'Email is invalid.');
	}
};