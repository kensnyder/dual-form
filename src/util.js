"use strict";

var uid = 0;

var util = {
	getUid: function() {
		return ++uid;
	},
	generateId: function(fromName) {
		return util.castToString(fromName).replace(/(?:^|\W+)([a-z])/g, function($0, $1) {
			return $1.toUpperCase();
		}).replace(/\W/g, '');
	},
	tag: function(tagName, attrs) {
		attrs = attrs || {};
		if (!('id' in attrs) && !!attrs.name) {
			attrs.id = util.generateId(attrs.name);
		}
		var html = '<' + tagName + util.attr(attrs) + '>';
		return html;
	},
	attr: function(attrs) {
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
				out += ' ' + util.esc(p) + '="' + util.esc(attrs[p]) + '"'; 
			}
		}
		return out;
	},
	nameToPath: function(name) {
		return name.
			replace(/\[(\w+)\]/g, '.$1.').
			replace(/\.{2,}/g, '.').
			replace(/\.$/, '').
			split('.')
		;
	},
	dive: function(data, path) {
		var attr;
		while (path.length > 0 && data !== undefined) {
			attr = path.shift();
			data = data[attr];
			if (Array.isArray(data) && path[0] == '[]') {
				return data.shift();
			}
		}
		return data;
	},
	castToString: function(s) {
		return (s === false || s === null || s === undefined ? '' : '' + s);
	},
	escapeChars: {
	  "&": "&amp;",
	  "<": "&lt;",
	  ">": "&gt;",
	  '"': "&quot;",
	  "'": "&#x27;"
	},
	esc: function(text) {
		return util.castToString(text).replace(/[&<>"']/g, function($0) {
			return util.escapeChars[$0];
		});
	},
	createClass: function(Parent, methods) {
		methods = methods || {};
		var ctor = function() {
			this.construct.apply(this, [].slice.call(arguments));
		};
		ctor.prototype = Object.create(Parent.prototype);
		ctor.prototype.constructor = ctor;
		ctor.prototype.callSuper = function() {
			var args = [].slice.call(arguments);
			var method = args.shift();
			return Parent.prototype[method].apply(this, args);
		};
		ctor.prototype.applySuper = function(method, args) {
			return Parent.prototype[method].apply(this, args);
		};
		ctor.subclass = function(methods) {
			return util.createClass(ctor, methods);
		};	
		if (methods.construct) {
			if (Parent.prototype.construct) {				
				ctor.prototype.construct = (function(construct) {
					return function() {
						var args = [].slice.call(arguments);
						Parent.prototype.construct.apply(this, args);
						construct.apply(this, args);
					};
				})(methods.construct);
			}
			else {
				ctor.prototype.construct = methods.construct;
			}
		}
		for (var name in methods) {
			if (!methods.hasOwnProperty(name) || name == 'construct') {
				continue;
			}
			ctor.prototype[name] = methods[name];
		}
		return ctor;
	}
};

module.exports = util;