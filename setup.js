/** Require.js bootstrap file */

// Config
require.config({
	baseUrl:		'js',
	paths: {
		'jquery':		'lib/jquery',
		'underscore':	'lib/uscore',
		'backbone':		'lib/backbone',
		'localstorage': 'lib/storage',
		'dygraph':		'lib/dygraph'
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

// Run application!
require(['app'], function(App){

	//console.log(App);

	App.init();
});
