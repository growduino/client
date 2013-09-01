// Graphing component
define(['util/mx-conf', 'util/mx-pers', 'dygraph', 'underscore', 'backbone'],
function(Configurable, Persistable, Dygraph){

	var exports = {
		/** @var {Object} */
		defaultOptions: {
			'title': 'Graph',
			'templateSelector': '#graph',
			'styles': {
				'wrapper' : {
					border: '1px solid red'
				}
			}
		},

		/** @var {Array} dygraph data series */
		data: [],
		/** @var {Object} dygraph data options */
		meta: {},
		/** @var {Object} dygraph plot */
		plot: null,

		start: function($el, options){
			this.$el = $el;
			this.config(_.defaults(options || {}, this.defaultOptions));

			// prepare graph template
			var templateSelector = this.option('templateSelector');
			var $graphTemplate = $(templateSelector);

			if ($graphTemplate.size() === 0) {
				throw 'Graph template [@name] not found!'
					.replace('@name', templateSelector);
			}

			var template = _.template($graphTemplate.html());
			var $graph = $(template({
				'title': this.option('title'),
				'id': this.cid
			})).removeClass('template');

			this.$el.prepend($graph);

			this.started = true;

			return this;
		},

		setData: function(data, meta){
			if (!_.isArray(data)) {
				throw 'Invalid argument: data has to be an object';
			}
			if (!_.isObject(meta)) {
				throw 'Invalid argument: meta has to be an object';
			}

			this.data = data;
			this.meta = meta;

			return this;
		},

		/**
		 * Draws graph.
		 */
		draw: function(options){
			var meta = _.defaults(options || {}, this.meta);
			var data = this.data;
			var element = this.$el.find('#'.concat(this.cid)+' .graph-body').get(0)

			this.plot = new Dygraph(
				element,
				data,
				meta
			);

			return this;
		},

		unzoom: function(){
			this.plot.resetZoom();
		}
	};

	Configurable._check(exports);
	Persistable._check(exports);


	// GraphView (configurable|persistable)
	return Backbone.View.extend(_.extend(_.extend(exports, Configurable), Persistable));
});
