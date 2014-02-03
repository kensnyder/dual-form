"use strict";

var util = require('./util');

var decorators = {
	none: function(element, html) {
		return html;
	},
	checkboxBr: function(checkbox, html) {
		if (checkbox.label) {
			html += ' ' + checkbox.label.render() + '<br>';
		}
		return html;
	},	
	checkboxDl: function(checkbox, html) {
		if (checkbox.label) {
			html = '<dt>' + checkbox.label.render() + '</dt><dd>' + html + '</dd>';
		}
		return html;
	},	
	checkboxTd: function(checkbox, html) {
		if (checkbox.label) {
			html = '<td>' + checkbox.label.render() + '</td><td>' + html + '</td>';
		}
		return html;
	},	
	checkboxTh: function(checkbox, html) {
		if (checkbox.label) {
			html = '<th>' + checkbox.label.render() + '</th><td>' + html + '</td>';
		}
		return html;
	},
	div: function(element, html) {
		var name = util.nameToPath(element.getName().replace(/\[\]$/, ''));
		var tagName = element.tagName;
		var classes = ['input', 'input-' + tagName, 'input-' + name.join('-')];
		var label = element.label ? label.render() : '';
		return util.tag('div', {"class":classes.join(' ')}) + label + html + util.tag('/div');
	}
};

module.exports = decorators;
