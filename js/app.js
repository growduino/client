// Application bootstrap file
// - Growduino Client v 0.2 -


define(['util/mx-conf', 'util/mx-pers', 'view/log', 'view/graph'],
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
			this.config(_.defaults(options || {}, this.defaultOptions));

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
					url: 'SENSORS/temp1.jso',
					dataType: 'json'
				}),
				$.ajax({
					url: 'SENSORS/humidity.jso',
					dataType: 'json'
				}),
				$.ajax({
					url: 'SENSORS/light.jso',
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

			var self = this;

			$.when.apply(this, sources)
				.done($.proxy(this.onDataLoaded, this))
				.fail($.proxy(this.onDataFailed, this))
				.always(function(){
					self.showData.call(self);
				});

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
		App.showData = function(graph){
			var graph = graph || new Graph();
			if (!graph.started) {
				graph.start($('#main'), {
					'title': this.dataTypes.join('-')
				});
			}

				this.dataTypes.unshift("Time");

				graph.setData(this.data, {
					labels:  this.dataTypes,
					colors: this.dataColors,
					fillGraph: true
				});
				graph.draw({
					width: 910,
					height: 380
				});

				var self = this;	// App

				// controls
				graph.$el.off();
				graph.$el.on('submit', 'form', function(evt){
					evt.preventDefault();

					var $form = $(this);
					var vals = $form.serializeArray();
					var date = _.last(vals);

					// @todo remove after rename data folders
					var dataName = function(x){
						if (x.match('humidity')) return 'Humidity';
						if (x.match('light')) return 'Light';
						if (x.match('temp1')) return 'Temperature';

						return x;
					}

					var d = date.value.split('/'),
						baseDate = new Date(),
						dayDate;
					var dataTypes = [];
					var dayData = {};

					var path = 'data/';
					var name;

					var pass = false;

					$(_.initial(vals)).each(function(i, x){
						if (x.value.match('on')) {
							name = dataName(x.name);
							dayData[name] = [];
							dataTypes.push(name);

							$(_.range(24)).each(function(i, hour){
								$.when($.ajax({
									url: path.concat(x.name, '/', date.value, '/', hour, '.jso'),
									dataType: 'json',
									async: false
								}))
								.done(function(data){
									pass = true;
									dayDate = new Date(baseDate.toString());
									dayDate.setYear(d[0]);
									dayDate.setMonth(d[1]);
									dayDate.setDate(d[2]);
									dayDate.setHours(hour)

									$(self['get' + name + 'Data'].call(self, data.min, dayDate)).each(function(i, x) {
										dayData[name].push(x);
									});
								});
							});
						}
					});

					if (!pass) {
						self.logger.show('No data for this date: ' + date.value, self.logger.WARN);
						return false;
					}

					self.dataTypes = dataTypes;
					self.dataColors = ['blue', 'green', 'yellow'];
					self.data = self.getCombinedData.apply(self, _.values(dayData));
					self.showData.call(self, graph);

					return false;
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

			$(rawData).each(function(i, x){

				// sanitize
				if (_.isFunction(sanitizer)) {
					x = sanitizer(x);
				}

				var date = new Date(baseDate.toString())
					date.setMinutes(i);
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
