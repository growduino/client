/** Require.js bootstrap file */

// Config
require.config({
	baseUrl:		'js',
	paths: {
		'jquery':		'lib/jquery',
		'underscore':	'lib/underscore',
		'backbone':		'lib/backbone'
	},
	shim: {
		'jquery': {
			exports: '$'
		},
		'underscore': {
            exports: '_',
			init: function(){
				this._.templateSettings = {interpolate : /\{(.+?)\}/g};
			}
        },
        'backbone': {
            deps: ['underscore', 'jquery'],
			exports: 'Backbone'
        }
	}
});

// Run application!
require(['app'], function(App){
	App.init();
});
