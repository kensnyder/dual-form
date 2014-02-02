"use strict";

var _ = require('lodash');
var util = require('./lib/util');
var Base = require('./lib/Base');
var Element = require('./lib/Element');
var Form = require('./lib/Form');
Form.decorators = require('./lib/decorators');
Form.validators = require('./lib/validators');
var elements = require('./lib/Form.Elements');
_.extend(Form, elements);

module.exports = {
	util: util,
	Base: Base,
	Element: Element,
	Form: Form
};