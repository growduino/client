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
			this.logger = new Log();
			if (!this.logger.started) this.logger.start();
			this.logger.show(this.NAME + ' ' + this.VERSION + ' started..', this.logger.SYSTEM);

			// caching
			this.cache = _.extend({}, Persistable);
			this.cache.setStore(this.option('cacheNamespace'));

			// load default data
			var sources = [
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
			];

			this.loadData(sources, {
				'Temperature': 'green',
				'Humidity': 'blue',
				'Light': 'yellow'
			});

			return this;
		};

		/**
		 * Data loader.
		 *
		 * @param {Array} sources
		 * @param {Object} settings
		 * @return {Object} fluent
		 */
		App.loadData = function(sources, settings){
			this.dataTypes = _.keys(settings);
			this.dataColors = _.values(settings);

			$.when
				.apply(this, sources)
				.done($.proxy(this.onDataLoaded, this))
				.fail($.proxy(this.onDataFailed, this))
				.always($.proxy(this.showData, this));

			return this;
		};

		/**
		 * Success callback.
		 */
		App.onDataLoaded = function(/*series1, ...*/){
			var self = this;

			// @todo set real date
			var baseDate = new Date();
			var series = [];

			$(arguments).each(function(i, x){
				series.push(self['get' + self.dataTypes[i] + 'Data'](x[0].min, baseDate));
			});


			this.data = this.getCombinedData.apply(this, series);

			this.cache.save('data', this.data, function(items){
				var serialized = [];
				var item;

				$(items).each(function(k, v){
					item = _.clone(v);
					item[0] = v[0].toString();
					serialized[k] = item;
				});

				return serialized;
			});

			this.logger.show('Loaded fresh data');
		};

		/**
		 * Error callback.
		 */
		App.onDataFailed = function() {
			this.data = this.cache.load('data', function(items){
				var deserialized = [];
				var item;

				$(items).each(function(k, v){
					item = v;
					item[0] = new Date(v[0]);
					deserialized[k] = item;
				});

				return deserialized;
			});

			if (this.data) {
				this.logger.show('Loaded cached data', this.logger.WARN);
			}
		};

		/**
		 * Data visualization.
		 */
		App.showData = function(){
			var graph = new Graph();
				graph.start($('#main'), {
					'title': this.dataTypes.join('-')
				});

				this.dataTypes.unshift("Time");

				graph.setData(this.data, {
					labels:  ["time", "Temperature", "Humidity", "Light"],
					colors: this.dataColors,
					fillGraph: true
				});
				graph.draw();

				// controls
				graph.$el.on('submit', 'form', function(evt){
					evt.preventDefault();

					var $form = $(this);
					console.log($form.serializeArray());
				});
		};

		/**
		 * Data parser shortcut (light).
		 *
		 * @param {Array} rawData
		 * @param {Date} baseDate
		 * @return {Array}
		 */
		App.getLightData = function(rawData, baseDate){
			return this.getDataSeries(rawData, baseDate, function(val){
				// sanitizer
				return (val === -999) ? NaN : 100;
			});
		};

		/**
		 * Data parser shortcut (temperature).
		 *
		 * @param {Array} rawData
		 * @param {Date} baseDate
		 * @return {Array}
		 */
		App.getTemperatureData = function(rawData, baseDate){
			return this.getDataSeries(rawData, baseDate, function(val){
				// sanitizer
				return (val < 0) ? NaN : val / 10;
			});
		};

		/**
		 * Data parser shortcut (humidity).
		 *
		 * @param {Array} rawData
		 * @param {Date} baseDate
		 * @return {Array}
		 */
		App.getHumidityData = function(rawData, baseDate){
			return this.getDataSeries(rawData, baseDate, function(val){
				// sanitizer
				return (val < 0) ? NaN : val / 10;
			});
		};

		/**
		 *	Data parser (general).
		 *
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

				var date = new Date(baseDate.toString())
					date.setHours(hourCount);
					date.setMinutes(minsCount);
					date.setSeconds(0);
					date.setMilliseconds(0);

				series.push([date, x]);
			});

			return series;
		};

		/**
		 * Data parser (dygraphs time series).
		 *
		 * @return {Array}
		 */
		App.getCombinedData = function(/*arguments*/){
			var length = arguments.length;
			var series = [];
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
							return NaN;
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
