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
					'border': '1px solid red'
				}
			}
		},

		/** @var {Array} dygraph data series */
		data: [],
		/** @var {Object} dygraph data options */
		meta: {},

		/** @var {Object} jQ element */
		$graph: null,
		/** @var {Object} dygraph plot */
		plot: null,

		render: function($el, options){
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

			this.$graph = $(template({
				'title': this.option('title'),
				'id': this.cid
			})).removeClass('template');

			this.$el.prepend(this.$graph);

			this.rendered = true;

			return this;
		},

		/**
		 * @param {String} contents Graph caption
		 */
		updateTitle: function(contents){
			this.$graph.find('.graph-title').html(contents);
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
				self.setAnnotations();
			});

			return this;
		},

		setAnnotations: function(){
			var plot = this.plot;

			var series = plot['file_'];
			var labels = plot['colorsMap_'];

			var min = [];
			var minDate = [];

			var max = [];
			var maxDate = [];

			var date, k;

			$(series).each(function(x, data){
				$(data).each(function(i, value){
					if (0 === i) {
						date = value;
						return;
					}

					if (_.isNaN(value)) {
						return;
					}

					k = i-1;
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

			var annotations = plot.annotations();
			$(_.keys(labels)).each(function(i, name){
				annotations.push({
					series: name,
					x: minDate[i].getTime(),
					shortText: 'L',
					text: 'Lo (min): ' + min[i]
				});
				annotations.push({
					series: name,
					x: maxDate[i].getTime(),
					shortText: 'H',
					text: 'Hi (max): ' + max[i]
				});
			});

			plot.setAnnotations(plot.annotations());
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
