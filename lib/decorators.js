"use strict";

var decorators = {
	none: function(element, html) {
		return html;
	},
	checkboxLabelBr: function(checkbox, html) {
		if (checkbox.label) {
			html += ' ' + checkbox.label.render() + '<br>';
		}
		return html;
	}
};

module.exports = decorators;
