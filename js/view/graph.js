// Graphing component
define(['util/mx-conf', 'jquery', 'underscore', 'backbone'], function(configurable){

	console.log(configurable);

	var exports = {};

		exports.NAME = 'Graph';


		exports.start = function($el, options){
			this.$el = $el;
			this.config(options || {});

			console.log('Graph view started..');

			return this;
		};

	var graphConfigurable = _.extend(configurable, exports);

	// Base graph (configurable)
	return _.extend(Backbone.View.extend({}), graphConfigurable);
});

