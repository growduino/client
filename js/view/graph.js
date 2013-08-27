// Graphing component
define(['util/mx-conf', 'util/mx-pers', 'dygraph', 'underscore', 'backbone', ],
function(Configurable,	Persistable, Dygraph){

//	console.log(Configurable);
//	console.log(Persistable);
//	console.log(Dygraph);


	var Graph = function(){
		this.defaultOptions = {
			'title': 'Graph',
			'templateSelector': '#graph',
			'styles': {
				'wrapper' : {
					border: '1px solid red'
				}
			}
		};

		this.data = [];
		this.meta = {};
		this.plot = null;

		this.start = function($el, options){
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
		};

		this.setData = function(data, meta){
			if (!_.isArray(data)) {
				throw 'Invalid argument: data has to be an object';
			}
			if (!_.isObject(meta)) {
				throw 'Invalid argument: meta has to be an object';
			}

			this.data = data;
			this.meta = meta;


			return this;
		};

		this.draw = function(){
			// draw graph..
			this.plot = new Dygraph(
				this.$el.find('#'.concat(this.cid)+' .graph-body').get(0),
				this.data,
				this.meta
			);

			return this;
		};

		this.reset = function(){
			this.plot.resetZoom();
		};
	};


	Configurable._check(Graph);
	Persistable._check(Graph);

	var graph = _.extend(new Graph(), Configurable);
		graph =  _.extend(graph, Persistable);

	// GraphView (configurable|persistable)
	return Backbone.View.extend(graph);
});

