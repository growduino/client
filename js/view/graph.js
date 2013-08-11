// Graphing component
define(['util/mx-conf', 'util/mx-persist', 'underscore', 'backbone'], function(Configurable, Persistable){

	var exports = {};

		exports.NAME = 'Graph View';


		exports.start = function($el, options){
			this.$el = $el;
			this.config(options || {});

			console.log('Graph view started..');

			return this;
		};


	Configurable._check(exports);
	Persistable._check(exports);

	var graphConfigurable = _.extend(Configurable, exports);
	var graphPersistable =  _.extend(Persistable, graphConfigurable);

	var GraphView = Backbone.View.extend(graphPersistable);

	// Base graph (configurable|persistable)
	return new GraphView();
});

