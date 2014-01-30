"use strict";
// function extend() {
// 	for (var i = 0, len = arguments.length; i < len; i++) {
// 		for
// 	}
// }
function Form(attrs) {
	this.elements = [];
	this.data = {};
	this.attributes = attrs || {};
	if (!('action' in this.attributes)) {
		this.attributes.action = '';
	}
	if (!('method' in this.attributes)) {
		this.attributes.method = 'GET';
	}
}
Form.prototype = {
	render: function() {
		return tag('form', this.attributes) + this.renderElements() + tag('/form');
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
			copy[name] = JSON.parse(JSON.stringify(value));
			while ((element = this.elements[i++])) {
				path = nameToPath(element.attributes.name);
				resolvedValue = dive(copy, path);
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
	}
};
Form.Element = function() {};
Form.Element.prototype = {
	construct: function(attrs) {
		this.attributes = attrs || {};
		this.value = castToString(this.attributes.value);		
	},
	set: function(value) {
		this.value = castToString(value);
	},	
	render: function() {
		return tag(this.tagName, this.attributes);
	}
};
Form.createElementClass = function(tagName, Parent, methods) {
	methods = methods || {};
	var ctor = function() {
		this.construct.apply(this, [].slice.call(arguments));
	};
	ctor.prototype = Object.create(Parent.prototype);
	ctor.prototype.tagName = tagName;
	ctor.prototype.constructor = ctor;
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
Form.Textarea = Form.createElementClass('textarea', Form.Element, {
	render: function() {
		return tag('textarea', this.attributes) + esc(this.value) + tag('/textarea');
	}
});
Form.Input = Form.createElementClass('input', Form.Element, {
	construct: function() {
		this.type = 'text';		
	},
	render: function() {
		this.attributes.value = this.value;
		this.attributes.type = this.type;
		return tag('input', this.attributes);
	}
});
Form.Email = Form.createElementClass('input', Form.Input, {
	construct: function() {
		this.type = 'email';
	}
});
Form.Checkbox = Form.createElementClass('input', Form.Input, {
	construct: function() {
		this.type = 'checkbox';
	},
	set: function(value) {
		this.attributes.checked = (value === this.attributes.value ? 'checked' : undefined);
	}
});
Form.Radio = Form.createElementClass('input', Form.Checkbox, {
	construct: function() {
		this.type = 'radio';
	},
	set: function(value) {
		this.attributes.selected = (value === this.attributes.value ? 'selected' : undefined);
	}
});
Form.Option = Form.createElementClass('option', Form.Element, {
	construct: function() {
		this.text = castToString(this.attributes.text);
		delete this.attributes.text;
	},

	render: function() {
		this.attributes.value = this.value;
		return tag('option', this.attributes) + this.text + tag('/option');
	}
});
Form.Select = Form.createElementClass('select', Form.Element, {
	construct: function() {
		if (Array.isArray(this.attributes.options)) {
			this.options = this.attributes.options.map(function(option) {
				if (option instanceof Form.Option) {
					return option;
				}
				else {
					return new Form.Option(option);
				}
			});
		}
		else {
			this.options = [];
		}
		delete this.attributes.options;
	},	
	render: function() {
		return tag('select', this.attributes) + this.renderOptions() + tag('/select');
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
			value = castToString(value);
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

Form.util = {

};
function nameToPath(name) {
	return name.
		replace(/\[(\w+)\]/g, '.$1.').
		replace(/\.{2,}/g, '.').
		replace(/\.$/, '').
		split('.')
	;
}
function dive(data, path) {
	var attr;
	while (path.length > 0 && data !== undefined) {
		attr = path.shift();
		data = data[attr];
		if (Array.isArray(data) && path[0] == '[]') {
			return data.shift();
		}
	}
	return data;
}
function tag(tagName, attrs) {
	attrs = attrs || {};
	if (!('id' in attrs) && !!attrs.name) {
		attrs.id = castToString(attrs.name).replace(/(?:^|\W+)([a-z])/g, function($0, $1) {
			return $1.toUpperCase();
		}).replace(/\W/g, '');
	}
	var html = '<' + tagName + attr(attrs) + '>';
	// var wrapper = attr.wrapper === false ? '%s%s' : (attr.wrapper || '<div class="input input-%s">%s</div>');
	// html = sprintf(wrapper, tagName, html);
	return html;
}
function sprintf() {
	var args = [].slice.call(arguments);
	var tpl = args.shift();
	return tpl.replace(/%s/g, function() {
		return args.shift();
	});
}
function attr(attrs) {
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
			out += ' ' + esc(p) + '="' + esc(attrs[p]) + '"'; 
		}
	}
	return out;
}
var map = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;"
};
function castToString(s) {
	return (s === false || s === null || s === undefined ? '' : '' + s);
}
function esc(text) {
	return castToString(text).replace(/[&<>"']/g, function($0) {
		return map[$0];
	});
}

module.exports = Form;
