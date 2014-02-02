"use strict";

var _ = require('lodash');
var util = require('./util');
var Base = require('./Base');
var Element = require('./Element');
var Form = require('./Form');
Form.decorators = require('./decorators');
Form.validators = require('./validators');
var elements = require('./Form.Elements');
_.extend(Form, elements);

module.exports = {
	util: util,
	Base: Base,
	Element: Element,
	Form: Form
};