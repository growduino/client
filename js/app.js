// Application bootstrap file
// - Growduino Client v 0.2 -


define(['util/mx-conf', 'util/mx-persist', 'view/log', 'view/graph'],
function(Configurable, Persistable, Log, Graph){

	var App = {};

		App.VERSION = '0.2';
		App.NAME = 'GrowduinoClientApp';

		App.defaultOptions = {
			cacheNamespace: 'app-cache'
		};


		/**
		 * @param {Object} options (mx-conf)
		 * @return fluent
		 */
		App.init = function(options){
			this.config(_.extend(this.defaultOptions, options || {}));

			// logging
			var logger = new Log();
				if (!logger.started) logger.start();
				logger.show(this.NAME + ' ' + this.VERSION + ' started..');

			// caching
			var cache = _.extend({}, Persistable);
				cache.setStore(this.option('cacheNamespace'));

			var data = null;

			// load data
			var self = this;
			$.when(
				$.ajax({
					url: 'data/temperature.jso',
					dataType: 'json'
				}),
				$.ajax({
					url: 'data/humidity.jso',
					dataType: 'json'
				}),
				$.ajax({
					url: 'data/light.jso',
					dataType: 'json'
				})
			)
			.done(function(temperature, humidity, light){
//				console.log(temperature);
//				console.log(humidity);
//				console.log(light);

				// @todo set real date
				var baseDate = new Date();

				var finalData = self.getCombinedData(
					self.getLightData(light[0].min, baseDate),
					self.getTemperatureData(temperature[0].min, baseDate),
					self.getHumidityData(humidity[0].min, baseDate)
				);

					data = finalData;
					cache.save('data', data);

					logger.show('Loaded fresh data');
			})
			.fail(function() {
				var finalData = cache.load('data');
				if (finalData) {
					data = finalData;

					console.log(data);

					logger.show('Loaded cached data');
				}
			})
			.always(function(){
				var finalData = data;

				var graph = new Graph();
					graph.start($('#main'), {
						'title': 'Light+Temp+Hum'
					});
					graph.setData(finalData, {
						labels: ["time",	"LIGHT",	"TEMP",		"HUM"],
						colors: [			"yellow",	"green",	"blue"],
						fillGraph: true
					});
					graph.draw();
			});

			return this;
		};

		/**
		 * @param {Array} rawData
		 * @param {Date} baseDate
		 * @return {Array}
		 */
		App.getLightData = function(rawData, baseDate){
			return this.getDataSeries(rawData, baseDate, function(val){
				// sanitizer
				return (val === -999) ? 0 : 100;
			});
		};

		/**
		 * @param {Array} rawData
		 * @param {Date} baseDate
		 * @return {Array}
		 */
		App.getTemperatureData = function(rawData, baseDate){
			return this.getDataSeries(rawData, baseDate, function(val){
				// sanitizer
				return (val < 0) ? 0 : val / 10;
			});
		};

		/**
		 * @param {Array} rawData
		 * @param {Date} baseDate
		 * @return {Array}
		 */
		App.getHumidityData = function(rawData, baseDate){
			return this.getDataSeries(rawData, baseDate, function(val){
				// sanitizer
				return (val < 0) ? 0 : val / 10;
			});
		};

		/**
		 * @param {Array} rawData
		 * @param {Date} baseDate
		 * @param {Function} sanitizer
		 * @return {Array}
		 */
		App.getDataSeries = function(rawData, baseDate, sanitizer){
			var series = [];
			var minsCount = 1;
			var hourCount = 0;

			$(rawData).each(function(i, x){
				if ((i + 1) % 60 === 0) {
					minsCount = 1;
					hourCount++;
				} else {
					minsCount++;
				}

				// sanitize
				if (_.isFunction(sanitizer)) {
					x = sanitizer(x);
				}

				var date = new Date();
					date.setYear(baseDate.getYear());
					date.setMonth(baseDate.getMonth());
					date.setDate(baseDate.getDay());
					date.setHours(hourCount);
					date.setMinutes(minsCount);
					date.setSeconds(0);
					date.setMilliseconds(0);

				series.push([date, x]);
			});

			return series;
		};

		/**
		 * @return {Array}
		 */
		App.getCombinedData = function(/*arguments*/){
			var series = [];
			var length = arguments.length;
			var found, item;

			$(arguments).each(function(ai, ax){
				// data series: tempData
				$(ax).each(function(di, dx){
					// data series items: [date, value]
					if (!dx[0]) return;

					found = false;
					$(series).each(function(si, sx){
						// final series items: [date, value, ...]
						if (sx[0].getTime() === dx[0].getTime()) {
							found = true;
							sx[ai + 1] = dx[1];
						}
					});
					if (!found) {
						item = _.range(length + 1);
						item = _.map(item, function(){
							return 0;
						});
						item[0] = dx[0];
						item[ai + 1] = dx[1];
						series.push(item);
					}
				});
			});

			return series;
		};


	var appConfigurable = _.extend(App, Configurable);

	return appConfigurable;
});
