"use strict";

function registerHelpers(hbs) {
	var helpers = {
		formrender: function(form, fieldname, options) {
			var element;
			if (fieldname) {
				element = form.getElement(fieldname);
				if (options) {
					element.setAttributes(options.hash);
				}
				return element ? element.render() : '';
			}
			if (options) {
				form.setAttributes(options.hash);
			}
			return form.render();
		}
	};
	Object.keys(helpers).forEach(function(key) {
		hbs.registerHelper(key, helpers[key]);
	});
}

module.exports = registerHelpers;