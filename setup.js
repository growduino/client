/** Require.js bootstrap file */

// Config
require.config({
	baseUrl:		'js',
	enforceDefine:	true,
	paths: {
		'jquery': [
			'http://code.jquery.com/jquery-1.10.1.min',	// cdn
			'lib/jquery'	// fallback
		],
		'underscore': [
			'http://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.5.2/underscore-min',
			'lib/uscore',
		],
		'backbone': [
			'http://cdnjs.cloudflare.com/ajax/libs/backbone.js/1.0.0/backbone-min',
			'lib/backbone'
		],
		'localstorage':	[
			'http://cdnjs.cloudflare.com/ajax/libs/backbone-localstorage.js/1.0/backbone.localStorage-min',
			'lib/storage',
		],
		'dygraph': [
			'http://dygraphs.com/1.0.1/dygraph-combined',
			'lib/dygraph'
		]
	},
	shim: {
		'jquery': {
			exports: '$'
		},
		'underscore': {
			init: function(){
				this._.templateSettings = {interpolate : /\{(.+?)\}/g};
			},
			exports: '_'
        },
        'backbone': {
            deps: ['underscore', 'jquery'],
			exports: 'Backbone'
        },
		'dygraph': {
			exports: 'Dygraph'
		}
	}
});


// Debug instance
window.testableApp = null;

// Run application!
require(['app'], function(App){

	//console.log(App);

	App.init();

	window.testableApp = App;
});
