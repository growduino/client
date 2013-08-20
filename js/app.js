// Application bootstrap file
// - Growduino Client v 0.1 -


define(['util/mx-conf', 'util/mx-persist', 'view/graph', 'view/log'],
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
				if (!logger.started) logger.start();
				logger.show(this.NAME + ' ' + this.VERSION + ' starting..');

//			var cache = _.extend({}, Persistable);
//				cache.setStore('app-cache');
//				// test
//				cache.save('foo', {name:'John'});
//				console.log(cache.load('foo'));
//				console.log(cache.load('bar'));
//
//			// make some graphs
			var graph1 = new Graph();
				graph1.start($('#main'), {
					'title': 'Temperature+Humidity+Light'
				});
				// test data
				graph1.setData([
					// date, series1, series2, ...
					[new Date("2013/08/20 16:30"),22.5,38.0,-1],
					[new Date("2013/08/20 16:31"),22.7,38.0,-1],
					[new Date("2013/08/20 16:32"),22.7,38.0,-1],
					[new Date("2013/08/20 16:33"),22.6,38.0,-1],
					[new Date("2013/08/20 16:34"),22.7,38.5,-1],
					[new Date("2013/08/20 16:35"),22.5,38.5,-1],
					[new Date("2013/08/20 16:36"),23.4,38.7,100],
					[new Date("2013/08/20 16:37"),23.9,39.2,100],
					[new Date("2013/08/20 16:38"),24.8,39.8,100],
					[new Date("2013/08/20 16:39"),26.1,40.3,100],
					[new Date("2013/08/20 16:40"),26.9,40.5,100],
					[new Date("2013/08/20 16:40"),27.2,40.5,100],
					[new Date("2013/08/20 16:42"),27.0,40.6,100],
					[new Date("2013/08/20 16:43"),27.0,40.6,100],
					[new Date("2013/08/20 16:44"),27.0,40.5,100],
				], {
					labels: [ "time", "TMP", "HUM", "LIGHT" ]
				});
				graph1.draw();

				// load data
//				$.ajax({
//					url: 'data/light_sensor.json',
//					dataType: 'json',
//					success: function(response){
//						console.log('Success:');
//						console.log(response);
//					},
//					error: function(response) {
//						console.log('Error:');
//						console.log(response);
//					}
//				});

			return this;
		};


	var appConfigurable = _.extend(App, Configurable);

	return appConfigurable;
});
