// Application bootstrap file
// - Growduino Client v 0.1 -


define(['util/mx-conf', 'util/mx-persist', 'view/graph', 'view/log', ],
function(Configurable, Persistable, Graph, Log){

	var App = {};

		App.VERSION = '0.1';
		App.NAME = 'GrowduinoClientApp';

		/**
		 * @param {Object} options (mx-conf)
		 * @return fluent
		 */
		App.init = function(options){
			this.config(options || {});

			var logger = new Log();
				logger.start();
				logger.show(this.NAME + ' ' + this.VERSION + ' starting..');

			var cache = _.extend({}, Persistable);
//				cache.setStore('app-cache');
//				// test
//				cache.save('foo', {name:'John'});
//				console.log(cache.load('foo'));
//				console.log(cache.load('bar'));
//
//			// make some graphs
//			var graph1 = new Graph();
//				console.log(graph1);

			return this;
		};


	var appConfigurable = _.extend(App, Configurable);

	return appConfigurable;
});
