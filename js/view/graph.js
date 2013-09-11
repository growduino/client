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

			var self = this;
			this.plot.ready(function(){
				self.setAnnotations(self.plot);
			});

			return this;
		},

		setAnnotations: function(plot){
			var series = plot['file_'];
			var labels = plot['colorsMap_'];

			var annotations = [];

			var i = 0, k, date;

			var min = [];
			var minDate = [];

			var max = [];
			var maxDate = [];

			$(series).each(function(i, data){
				$(data).each(function(x, value){
					if (0 === x) {
						date = value;
						return;
					}
					if (_.isNaN(value)) {
						return;
					}
					k = x-1;
					if (_.isUndefined(max[k]) || max[k] < value) {
						max[k] = value;
						maxDate[k] = date;
					}
					if (_.isUndefined(min[k]) || min[k] > value) {
						min[k] = value;
						minDate[k] = date;
					}
				});
			});

			$(_.keys(labels)).each(function(i, name){
				annotations.push({
					series: name,
					x: minDate[i],
					shortText: 'L',
					text: 'Min: ' + min[i]
				});
				annotations.push({
					series: name,
					x: maxDate[i],
					shortText: 'H',
					text: 'Max: ' + max[i]
				});
			});


			plot.setAnnotations(annotations);
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
