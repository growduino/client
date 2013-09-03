// Application bootstrap file
// - Growduino Client v 0.2 -

define(['util/mx-conf', 'util/mx-pers', 'view/log', 'view/graph', 'view/form'],
function(Configurable, Persistable, Log, Graph, Form){

	var App = {};

		App.VERSION = '0.3';
		App.NAME = 'GrowduinoClientApp';

		App.defaultOptions = {
			cacheNamespace: 'app-cache'
		};

		App.component = {};

		/**
		 * @param {Object} options (mx-conf)
		 * @return fluent
		 */
		App.init = function(options){
			var app = this;

			this.config(_.defaults(options || {}, this.defaultOptions));

			// logging
			this.logger = new Log();
			if (!this.logger.started) this.logger.start();
			this.logger.show(this.NAME + ' ' + this.VERSION + ' started..', this.logger.SYSTEM);

			// caching
			this.cache = _.extend({}, Persistable);
			this.cache.setStore(this.option('cacheNamespace'));

			// load last sensor data
			$.when($.ajax({
				url: 'vstup.jso',
				dataType: 'json'
			})).done(function(data){
				var inputs = _.values(data);

				var sources = [];
				var path = 'sensors/';
				$(inputs).each(function(i, name){
					sources.push($.ajax({
						url: path.concat(name, '.jso'),
						dataType: 'json'
					}));
				});

				var sourceTypes = app.translate(inputs, {
					'humidity': 'Humidity',
					'temp1': 'Temperature',
					'light': 'Light'
				});
				var sourceSettings = app.translate(_.values(sourceTypes), {
					'Temperature': 'green',
					'Humidity': 'blue',
					'Light': 'yellow'
				});

				app.logger.show('Fetched local config file:' + JSON.stringify(data));

				app.loadData(sources, sourceSettings);
			}).fail(function(){
				console.log(arguments);
				app.logger.show('Failed to load local config file:', app.logger.ERROR);
			});



			// input form
			var $form = this.getComponent('inputForm');
				$form.$el.off();
				$form.$el.on('click', '[name=load]', function(evt){
					evt.preventDefault();
					app['inputFormLoad'].call(app, $form);
				});
				$form.$el.on('submit', function(evt){
					evt.preventDefault();
					app['inputFormSubmit'].call(app, $form);
				});
				$form.render($('#top'));

			return this;
		};

		App.translate = function(items, dict){
			var output = {};

			$(items).each(function(i, item){
				if (_.contains(_.keys(dict), item)) {
					output[item] = dict[item];
				}
			});

			return output;
		}

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
			if (0 === arguments.length) {
				throw 'Recieved no data';
			}

			var self = this;
			var series = [];

			$(arguments).each(function(i, x){
				// @todo data sniff for keys: "time, name, min, h, day"
				var ts = parseInt(x[0].time) * 1000;
				series.push(self['get' + self.dataTypes[i] + 'Data'](x[0].min, new Date(ts)));
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

			this.logger.show('Loaded fresh data: ' + JSON.stringify(_.object(this.dataTypes, this.dataColors)));
		};

		/**
		 * Error callback.
		 */
		App.onDataFailed = function() {
			// try to load last cahced data
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
		App.showData = function(graphName){
			if (_.isEmpty(this.data)) {
				throw 'No data to display';
			}
			if (_.isEmpty(this.dataTypes)) {
				throw 'Data types not set';
			}
			if (_.isEmpty(this.dataColors)) {
				throw 'Data colors not set';
			}

			var $graph = this.getComponent(graphName || 'mainGraph');

			// @todo render()
			if (!$graph.started) {
				$graph.start($('#main'), {
					'title': this.dataTypes.join('-')
				});
			}

				this.dataTypes.unshift("Time");

				$graph.setData(this.data, {
					labels:  this.dataTypes,
					colors: this.dataColors,
					fillGraph: true
				});
				$graph.draw({
					width: 910,
					height: 380
				});

				var app = this;	// App

				// controls
				var $form = this.getComponent('graphControlForm');
					$form.$el.off();
					$form.$el.on('submit', function(evt){
						evt.preventDefault();
						app['graphControlFormSubmit'].call(app, $form);
						return false;
					});
					$form.render($graph.$el.find('.graph-controls'));
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
				// on-off
				return (val === -999) ? NaN : 100;

				// precise
//				return (val === -999) ? NaN : Math.round(val/10, 1);
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

		/**
		 * Factory shortcut.
		 *
		 * @param {String} name
		 * @return {Object}
		 */
		App.getComponent = function(name){
			var cb = 'create'.concat(name.replace(/^([a-z])/, function($1){
				return $1.toUpperCase();
			}));

			if (!_.isFunction(this[cb])) {
				throw 'Factory method missing:' + cb;
			}

			if (_.isUndefined(this.component[name])) {
				this.component[name] = this[cb].call(this, name);
			}

			return this.component[name];
		};

		/**
		 * @param {String} name
		 * @return {Backbone.View}
		 */
		App.createInputForm = function(name){
			var form = new Form();
				form.setName(name || 'inputForm');
				form.setCaption('Pins');

				form.addTextArea('inputs', 'data', {
					cols: 50,
					rows: 1
				});
				form.addButton('load');
				form.addSubmit('save');

			return form;
		};

		/**
		 * @param {Backbone.View} $form
		 */
		App.inputFormLoad = function($form){
			var app = this;
			$.ajax({
				type: 'GET',
				url: 'vystup.jso',
				dataType: 'text'
			})
			.done(function(data){
				$form.setValues({
					'inputs': data
				});
			})
			.fail(function(response, status, error){
				app.logger.show($form.getName() + ': ' + error.message, app.logger.ERROR);
			})
		};

		/**
		 * @param {Backbone.View} $form
		 */
		App.inputFormSubmit = function($form){
			var app = this;
			var data = $form.getValues();

			$.ajax({
				type: 'POST',
				url: '/save',
				data: data.inputs
			})
			.done(function(){
				$form.reset();
				app.logger.show($form.getName() + ': Data saved', app.logger.SUCCESS);
			})
			.fail(function(response, status, error){
				app.logger.show($form.getName() + ': ' + error.message, app.logger.ERROR);
			});
		};

		/**
		 * @param {String} name
		 * @return {Backbone.View}
		 */
		App.createGraphControlForm = function(name){
			var form = new Form();
				form.setName(name || 'graphControlForm');
				form.setCaption('Controls');

				form.addSelect('year', 'Year', {
					'2013': 2013
				});
				form.addSelect('month', 'Month', _.object(_.range(1, 13), _.range(1, 13)));
				form.addSelect('day', 'Day', _.object(_.range(1, 32), _.range(1, 32)));
				form.addSubmit('load', 'Load');
				form.addButton('unzoom', 'Unzoom').hide();	// @todo plot event handler

				form.setRenderer(function(){
					// all-in-line
					var $wrap = $('<div>');

					$(_.values(this.part[this.cid])).each(function(i, part){
						$wrap.append(part.$label || null);
						$wrap.append(part.$input);
					});

					return $wrap;
				});

			return form;
		};

		/**
		 * @param {Backbone.View} $form
		 */
		App.graphControlFormSubmit = function($form){
			var data = $form.getValues();

			var date = '';
			if (data.year) {
				date = date.concat('/', data.year);
			}
			if (data.month && data.year) {
				date = date.concat('/', data.month);
			}
			if (data.day && data.month && data.year) {
				date = date.concat('/', data.day);
			}

			var dataSource = function(name){
				if (name.match('Temperature')) return 'Temp1';
				else return name;
			};

			var baseDate;
			var dataTypes = ['Humidity', 'Temperature', 'Light', ];	// @todo
			var dataColors = ['green', 'blue', 'yellow'];
			var dayData = {};

			var path = 'data/';
			var pass = false;

			var self = this;

			$(dataTypes).each(function(i, source){
				dayData[source] = [];

				$(_.range(24)).each(function(hour){
					$.when($.ajax({
						url: path.concat(dataSource(source).toUpperCase(), date, '/', hour, '.jso'),
						dataType: 'json',
						async: false
					}))
					.done(function(payload){
						pass = true;
						baseDate = new Date(data.year, data.month, data.day);
						baseDate.setHours(hour);

						$(self['get' + source + 'Data'].call(self, payload.min, baseDate)).each(function(i, x) {
							dayData[source].push(x);
						});
					});
				});
			});

			if (!pass) {
				this.logger.show('No data for this date: ' + date, this.logger.WARN);
				return;
			} else {
				this.logger.show('Fetched data for this date: ' + date, this.logger.SUCCESS);
			}

			this.dataTypes = dataTypes;
			this.dataColors = dataColors;
			this.data = this.getCombinedData.apply(this, _.values(dayData));
			this.showData.call(this, 'mainGraph');
		};

		App.createMainGraph = function(name){
			return new Graph();
		};


	// App singleton @todo instance?
	return _.extend(App, Configurable);
});
