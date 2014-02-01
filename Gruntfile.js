'use strict';

module.exports = function(grunt) {

	var pkg = grunt.file.readJSON('package.json');

	grunt.initConfig({
		pkg: pkg,
		banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> -' +
		' <%= grunt.template.today("mmm yyyy") %>, <%= pkg.homepage %>' +
		' - Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
		' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',
		jshint: {
			src: {
				options: {
					"curly": true,
					"eqnull": true,
					"eqeqeq": false,
					"undef": true,
					"unused": false,
					"laxbreak": true,
					"node": true,
					"smarttabs": true,
					"globals": {}
				},
				src: ['src/**/*.js']
			}
		},
		nodeunit: {
			all: ['test/**/*.js']
		},
		uglify: {
			options: {
				banner: '<%= banner %>',
				report: 'gzip'
			},
			dist: {
				src:  './src/diskStorage.js',
				dest: './dist/diskStorage.min.js'
			},
			shims: {
				src:  './dist/DiskStorage.shims.min.js',
				dest: './dist/DiskStorage.shims.min.js'
			}
		},
		yuidoc: {
			compile: {
				name: '<%= pkg.name %>',
				description: '<%= pkg.description %>',
				version: '<%= pkg.version %>',
				url: '<%= pkg.homepage %>',
				options: {
					paths: ['src'],
					outdir: 'docs'
				}
			}
		},
		watch: {
			scripts: {
				files: ['Gruntfile.js', 'src/**/*.*', 'test/**/*.*'],
				tasks: ['jshint', 'nodeunit']
			}
		}
	});

	// These plugins provide necessary tasks.
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-nodeunit');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-yuidoc');
	grunt.loadNpmTasks('grunt-contrib-watch');
	
//	grunt.registerTask('logo', 'Copy logo to yuidoc files', function() {
//		grunt.file.copy('logo.png', 'docs/assets/css/logo.png');
//	});
//	
//	// custom tasks	
//	function extractDocs(data) {
//		var docs = {
//			pkg: pkg,
//			properties: [],
//			methods: [],
//			staticProperties: [],
//			staticMethods: [],
//			options: []
//		};
//		docs.constructor = data.classes.DiskStorage;
//		data.classitems.forEach(function(item) {
//			if (item.itemtype == 'property' && item.name == 'options') {
//				docs.options = item.subprops;
//			}
//			else if (item.itemtype == 'method') {
//				docs.methods.push(item); 
//			}
//			else if (item.itemtype == 'property') {
//				docs.properties.push(item); 
//			}
//			else if (item['static'] && item.itemtype == 'method') {
//				docs.staticMethods.push(item); 
//			}
//			else if (item['static'] && item.itemtype == 'property') {
//				docs.staticProperties.push(item); 
//			}
//		});
//		// remove yuidoc crossLink mustache tags
//		var docStr = JSON.stringify(docs).replace(/\{\{.+?\}\}(.+?)\{\{.+?\}\}/g, '$1');
//		docs = JSON.parse(docStr);
//		return docs;
//	}
//	
//	grunt.registerTask('readme', 'Compile the README based on source documentation', function() {
//		var tpl = grunt.file.read('src/README.md');
//		var docData = extractDocs( grunt.file.readJSON('docs/data.json') );
//		var readme = grunt.template.process(tpl, {data:docData});
//		grunt.file.write('./README.md', readme);
//	});
//	
//	grunt.registerTask('updateVersions', 'Update version strings in files', function() {
//		var js = grunt.file.read('dist/DiskStorage.min.js');
//		js = js.replace('%VERSION%', pkg.version);
//		grunt.file.write('dist/DiskStorage.min.js', js);
//		var json = grunt.file.read('./package.json');
//		json = json.replace(/("version"\s*:\s*").+?"/, '$1'+pkg.version+'"');
//		grunt.file.write('./package.json', json);
//	});
//
//	// build steps
//	grunt.registerTask('build', ['shims','uglify','yuidoc','logo','readme']);
//
//	// Default task.
//	grunt.registerTask('default', ['jshint', 'qunit', 'build']);

};
