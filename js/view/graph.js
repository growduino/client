// Graphing component
define(['util/mx-conf', 'util/mx-persist', 'underscore', 'backbone'/*, dygraph*/],
function(Configurable,	Persistable){

//	console.log(Configurable);
//	console.log(Persistable);

	var Graph = function(){
		this.NAME = 'Graph';

		this.data = {};
		this.defaultOptions = {
			'styles': {
				'wrapper' : {

				}
			}
		}

		this.start = function($el, options){
			this.$el = $el;
			this.config(_.extend(this.defaultOptions, options || {}));

			// console.log('Graph view started..');

			return this;
		};

		this.setData = function(data){
			if (!_.isObject(data)) {
				throw 'Invalid argument: data has to be an object';
			}

			this.data = data;

			return this;
		};

		this.draw = function(){
			this.$el.css(this.option('styles').wrapper);
			this.$el.show();

			// draw graph..

			return this.$el;
		};
	};


	Configurable._check(Graph);
	Persistable._check(Graph);

	var graph = _.extend(new Graph(), Configurable);
		graph =  _.extend(graph, Persistable);

	// GraphView (configurable|persistable)
	return Backbone.View.extend(graph);
});

