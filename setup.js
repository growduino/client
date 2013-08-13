/** Require.js bootstrap file */

// Config
require.config({
	baseUrl:		'js',
	paths: {
		'jquery':		'lib/jquery',
		'underscore':	'lib/underscore',
		'backbone':		'lib/backbone',
		'localstorage': 'lib/backbone.localStorage'
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
        }
	}
});

// Run application!
require(['app'], function(App){

	//console.log(App);

	App.init();
});
