// Application bootstrap file
// - Growduino Client v 0.4 -

define(['util/mx-conf', 'util/mx-pers', 'view/log', 'view/graph', 'view/form'],
function(Configurable, Persistable, Log, Graph, Form){

	var App = {};

		App.VERSION = '0.4';
		App.NAME = 'GrowduinoClientApp';

		App.defaultOptions = {
			baseUrl: 'http://arduino.natur.cuni.cz/',	// remote
//			baseUrl: '/growduino/',	// local
			configFile: 'config.jso',
			inputConfigFile: 'vstup.jso',
			outputConfigFile: 'vystup.jso',

			cacheNamespace: 'app-cache'
		};

		App.component = {};

		App.dataPaths = [];
		App.dataTypes = [];
		App.dataColors = [];

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

			// load config
			this.handleLoadConfig(this.option('inputConfigFile'))
				// load last sensor data
				.done(function(){
					return app.handleLoadFreshData();
				});

			// config form
			var $configForm = this.getComponent('configForm');
				$configForm.addEvents({
					'click [name=save]': function(evt){
						evt.preventDefault();
						app['processConfigForm'].call(app, $configForm);
					}
				});
				$configForm.$el.addClass('component');
				$configForm.render($('#top')).toggleMode();


			// output form (pins)
			var $outputForm = this.getComponent('outputForm');
				$outputForm.addEvents({
					'click [name=save]': function(evt){
						evt.preventDefault();
						app['processOutputForm'].call(app, $outputForm);
					}
				});
				$outputForm.$el.addClass('component');
				$outputForm.render($('#top')).toggleMode();


			// end
			return this;
		};



		/**
		 * Data loader.
		 *
		 * @param {Array} sources
		 * @return {Object} promise
		 */
		App.loadData = function(sources){
			var app = this;

			var Worker = ($.when).apply(this, sources);
				Worker
					.done($.proxy(this.onDataLoaded, this))
					.fail($.proxy(this.onDataFailed, this))
					.always(function(){
						app.showData();
					});

			return Worker;
		};

		/**
		 * Success callback.
		 */
		App.onDataLoaded = function(/*series1, ...*/){
			if (0 === arguments.length) {
				throw 'Recieved no data';
			}

			var app = this;
			var series = [];
			var tx, ts, date, data;

			$(arguments).each(function(i, x){
				// sniff for keys: name, min, h, day"
				tx = app.Time.now();

				if (x[0].min) {
					data = x[0].min;
					tx  -= data.length * app.Time.MINUTE;
					ts   = new Date(tx);
					date = app.Time.getDate(ts) + ' ' + app.Time.getHour(ts) + ':' + app.Time.getMinute(ts);

				}
				else if (x[0].h) {
					data = x[0].h;
					tx  -= data.length * app.Time.HOUR;
					ts   = new Date(tx);
					date = app.Time.getDate(ts) + ' ' + app.Time.getHour(ts);

				}
				else if (x[0].day) {
					data = x[0].day;
					tx  -= data.length * app.Time.DAY;
					ts   = new Date(tx);
					date = app.Time.getDate(ts);

				}
				else {
					throw 'Unexpected data series identifier';
				}

				if (_.contains(app.dataTypes, 'Time')) {
					app.dataTypes.shift('Time');
				}

				series.push(app['get' + app.dataTypes[i] + 'Data'](data, date));
			});

			this.data = this.getCombinedData.apply(this, series);

			this.cache.save('data', this.data);

			this.logger.show('Loaded fresh data: ' + JSON.stringify(_.object(this.dataTypes, this.dataColors)));
		};

		/**
		 * Error callback.
		 */
		App.onDataFailed = function() {
			var Time = this.Time;
			// try to load last cahced data
			this.data = this.cache.load('data', function(items){
				var deserialized = [];
				var item, d;

				$(items).each(function(k, v){
					d = new Date(Date.parse(v[0]));
					item = v;
					item[0] = Time.getPath(d);
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
			var app = this;

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

			if (!$graph.rendered) {
				$graph.render($('#main'));
			}

			$graph.updateTitle(this.dataTypes.join('-'));

			if (!_.contains(this.dataTypes, 'Time')) {
				this.dataTypes.unshift('Time');
			}

			$graph.setData(this.data, {
				labels:  this.dataTypes,
				colors: this.dataColors,
				fillGraph: true
			});

			// controls: custom date control
			var $dateForm = this.getComponent('dateGraphControlForm');
				$dateForm.delegateEvents({
					'submit': function(evt){
						evt.preventDefault();
						app['processDateGraphControlForm'].call(app, $dateForm);
					}
				});
				$dateForm.$el.addClass('lft');
				$dateForm.render($graph.$el.find('.graph-controls'));

			// controls: button control
			var $buttForm = this.getComponent('buttonGraphControlForm');
				$buttForm.delegateEvents({
					'click [name=fresh]': function(){
						app['handleLoadFreshData'].call(app, $buttForm);
					},
					'click [name=month]': function(){
						app['handleLoadMonthData'].call(app, $buttForm);
					},
					'click [name=year]': function(){
						app['handleLoadYearData'].call(app, $buttForm);
					}
				});
				$buttForm.$el.addClass('rgt');
				$buttForm.render($graph.$el.find('.graph-controls'));

			$graph.draw({
				width: 910,
				height: 380
			});
		};

		/**
		 * Data parser shortcut (light sanitizer).
		 *
		 * @param {Array} rawData
		 * @param {String} baseDate
		 * @return {Array}
		 */
		App.getLightData = function(rawData, baseDate){
			return this.getDataSeries(rawData, baseDate, this.Data.decadicSanitizer);
		};

		/**
		 * Data parser shortcut (temperature sanitizer).
		 *
		 * @param {Array} rawData
		 * @param {String} baseDate
		 * @return {Array}
		 */
		App.getTemperatureData = function(rawData, baseDate){
			return this.getDataSeries(rawData, baseDate, this.Data.decadicSanitizer);
		};

		/**
		 * Data parser shortcut (humidity sanitizer).
		 *
		 * @param {Array} rawData
		 * @param {String} baseDate
		 * @return {Array}
		 */
		App.getHumidityData = function(rawData, baseDate){
			return this.getDataSeries(rawData, baseDate, this.Data.decadicSanitizer);
		};

		/**
		 *	Data parser (general).
		 *
		 * @param {Array} rawData
		 * @param {String} baseDate
		 * @param {Function} sanitizer
		 * @return {Array}
		 */
		App.getDataSeries = function(rawData, baseDate, sanitizer){
			var Time = this.Time;
			var time, tx, a = '';
			var series = [];

			if (/^\d{4}\/\d{2}$/.test(baseDate)) {
				// YYYY/MM
				tx = '1 day';
				a  = '/01';
			}
			else if (/^\d{4}\/\d{2}\/\d{2}$/.test(baseDate)) {
				// days YYYY/MM/DD
				tx = '1 hour';
			}
			else if (/^\d{4}\/\d{2}\/\d{2} \d{2}$/.test(baseDate)) {
				// hours YYYY-MM-DD HH
				tx = '1 minute';
				// minute fix
				a  = ':00';
			}
			else if (/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}$/.test(baseDate)) {
				// minutes YYYY-MM-DD HH:MM
				tx = '1 minute';
			}
			else {
				throw 'Unexpected date: ' + baseDate;
			}

			time = Date.parse(baseDate + a);

			if (_.isNaN(time)) {
				throw 'Unexpected date format: ' + baseDate;
			}

			time = new Date(time);


			$(rawData).each(function(i, x){
				// sanitize
				if (_.isFunction(sanitizer)) {
					x = sanitizer(x);
				}

				series.push([time, x]);

				time = Time.add(tx, time);
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
						item = item.map(function(){
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
		App.createOutputForm = function(name){
			var form = new Form();
				form.setName(name || 'outputForm');
				form.setCaption('Output', true);

				form.addTextArea('output', 'DATA', {
					cols: 50,
					rows: 1
				});

				form.addSubmit('save', 'Save');

				var app = this;
				var url = this.option('baseUrl') + this.option('outputConfigFile');

				$.ajax({
					url: url,
					type: 'GET',
					dataType: 'text',
					async: false,
					success: function(data){
						form.setValues({
							'output': data
						});
					},
					error: function(response, status, error){
						app.logger.show('Failed to fetch output config file: ' + url, app.logger.ERROR);
					}
				});

			return form;
		};

		/**
		 * @param {Backbone.View} $form
		 */
		App.processOutputForm = function($form){
		try {
			var app = this;
			var url = this.option('baseUrl') + this.option('outputConfigFile');
			var data = $form.getValues();

			$form.loading(true);

			$.ajax({
				url: url,
				type: 'POST',
				data: data.output,
				async: false,
				crossDomain: true,
				success: function(){
	//				$form.reset();
					app.logger.show($form.getName() + ': Data saved', app.logger.SUCCESS);
				},
				error: function(response, status, error){
					console.log(arguments);
					app.logger.show($form.getName() + ' ' + status + ': ' + error, app.logger.ERROR);
				}
			});

			$form.loading(false);
		} catch (e) {
			//console.log(e.message);
		}
		};

		/**
		 * @param {String} name
		 * @return {Backbone.View}
		 */
		App.createConfigForm = function(name){
			var form = new Form();
				form.setName(name || 'configForm');
				form.setCaption('Network', true);

			var app = this;
			var url = this.option('baseUrl') + this.option('configFile');

			$.ajax({
				url: url,
				type: 'GET',
				dataType: 'json',
				async: false,
				success: function(data){
					// dynamic fields
					for (var name in data) {
						if (name.match('use_dhcp')) {
							form.addSelect(name, name.toUpperCase(), {
								'0': 'no',
								'1': 'yes'
							});
						}
						else {
							form.addText(name, name.toUpperCase());
						}
					}
					form.setValues(data);
				},
				error: function(){
					app.logger.show('Failed to fetch config file: ' + url, app.logger.ERROR);
				}
			});

			form.addSubmit('save', 'Save');

			return form;
		};

		App.processConfigForm = function($form){
		try {
			var app = this;
			var url = this.option('baseUrl') + this.option('configFile');
			var data = $form.getValues();
				delete(data.save);	// @todo values exclude buttons?

			$form.loading(true);

			$.ajax({
				url: url,
				type: 'POST',
				data: JSON.stringify(data),
				async: false,
				crossDomain: true,
				success: function(){
//					$form.reset();
					app.logger.show($form.getName() + ': Data saved', app.logger.SUCCESS);
				},
				error: function(response, status, error){
//					console.log(arguments);
					app.logger.show($form.getName() + ' ' + status + ': ' + error, app.logger.ERROR);
				}
			});

			$form.loading(false);
		} catch (e) {
			//console.log(e.message);
		}
		};

		/**
		 * Custom date graph control.
		 *
		 * @param {String} name
		 * @return {Backbone.View}
		 */
		App.createDateGraphControlForm = function(name){
			var form = new Form();
				form.setName(name || 'graphControlForm');

				var year = this.Time.getCurrentYear();
				var opts = {};
					opts[year.toString()] = year;

				form.addSelect('year', 'Year', opts);

				form.addSelect('month', 'Month', _.object(
					_.values(_.range(1, 13)),
					_.values(_.range(1, 13))
				)).prepend($('<option>').val('0').text('-'));

				form.addSelect('day', 'Day', _.object(
					_.values(_.range(1, 32)),
					_.values(_.range(1, 32))
				)).prepend($('<option>').val('0').text('-'));

				form.addSubmit('load', 'Load');
				form.addButton('unzoom', 'Reset view').hide();	// @todo plot event handler

				form.setRenderer(form.allInLineRenderer);

			return form;
		};

		/**
		 * @param {Backbone.View} $form
		 */
		App.processDateGraphControlForm = function($form){
			var vals = $form.getValues();

			if (vals.year && !parseInt(vals.month)) {
				this.handleLoadYearData.call(this, $form);
				return;
			}

			if (vals.year && parseInt(vals.month) && !parseInt(vals.day)) {
				this.handleLoadMonthData.call(this, $form);
				return;
			}

			if (vals.year && parseInt(vals.month) && parseInt(vals.day)) {
				this.handleLoadDayData.call(this, $form);
				return;
			}

			throw 'Invalid form values: ' + vals.toString();
		};

		/**
		 * Button graph control
		 * @param {String} name [optional]
		 * @return {Backbone.View}
		 */
		App.createButtonGraphControlForm = function(name){
			var form = new Form();
				form.setName(name || 'graphControlForm');
				form.setCaption('Load data: ');

				form.addButton('year' , 'Year');
				form.addButton('month', 'Month');
				form.addButton('fresh', 'Fresh');

				form.setRenderer(function(){
					// all-in-line no caption
					var $wrap = $('<div>');

					$wrap.append($('<small>').text(this.getCaption()));

					$(_.values(this.part[this.cid])).each(function(i, part){
						$wrap.append(part.$label || null);
						$wrap.append(part.$input);
					});

					return $wrap;
				});

				return form;
		};

		/**
		 * @param {String} file
		 * @return {Object} promise
		 */
		App.handleLoadConfig = function(file){
			var app = this;
			var url = this.option('baseUrl') + file;

			try {

			var Worker = $.when($.ajax({
				url: url,
				dataType: 'json',
				async: false
			}));

			} catch (e) {
				//console.log(e.message);
			}

			Worker.done(function(inputs){
				app.logger.show('Fetched config file: ' + url);

				var sourceTypes = app.translate(_.values(inputs), {
					'humidity': 'Humidity',
					'temp1': 'Temperature',
					'light': 'Light'
				});
				var sourceSettings = app.translate(_.values(sourceTypes), {
					'Temperature': 'green',
					'Humidity': 'blue',
					'Light': 'yellow'
				});

				// data setup
				app.dataTypes  = _.keys(sourceSettings);
				app.dataColors = _.values(sourceSettings);
				app.dataPaths  = _.values(inputs);
			});

			Worker.fail(function(){
				app.logger.show('Failed to load local config file: ' + file, app.logger.ERROR);
				console.log(arguments);
			});

			return Worker;
		};

		/**
		 * Graph control handler
		 */
		App.handleLoadFreshData = function($form){
			if ($form) $form.loading(true);

			var sources = [];
			var basePath = this.option('baseUrl').concat('sensors/');

			try {

			$(this.dataPaths).each(function(x, path){
				sources.push($.ajax({
					url: basePath.concat(path, '.jso'),
					dataType: 'json'
				}));
			});

			} catch (e) {
				//console.log(e.message);
			}

			if ($form) $form.loading(false);

			// show
			return this.loadData.call(this, sources);
		};

		/**
		 * Graph control handler
		 */
		App.handleLoadDayData = function($form){
			var app = this;

			if (!this.dataTypes) {
				throw 'Data types not set';
			}
			if (!this.dataColors) {
				throw 'Data colors not set';
			}
			if (!this.dataPaths) {
				throw 'Data paths not set';
			}

			if ($form) $form.loading(true);

			var vals = $form.getValues();
			var date = this.Time.getPath(vals);

			$form.loading(true);


			var types = _.rest(this.dataTypes);
			var paths = this.dataPaths;

			var basePath = this.option('baseUrl').concat('data/');
			var dayData = {};
			var pass = false;
			var type, path;

			for (var i in paths) {
				path = paths[i];
				type = types[i];
				dayData[type] = [];

				try {

				$(_.range(24)).each(function(hour){
					$.ajax({
						url: basePath.concat(path, '/', date, '/', hour, '.jso'),
						dataType: 'json',
						async: false,
						success: function(data){
							pass = true;

							$(app['get' + type + 'Data'].call(app, data.min, date.concat(' ', hour, ':' , '00'))).each(function(x, data) {
								dayData[type].push(data);
							});
						},
						error: function(){
							// console.log(arguments);
						}
					});
				});

				} catch (e) {
					//console.log(e.message);
				}
			}

			$form.loading(false);

			if (!pass) {
				this.logger.show('No data for this date: ' + date, this.logger.WARN);
				return;
			} else {
				this.logger.show('Loaded custom date: ' + date, this.logger.SUCCESS);
			}

			// data setup
			this.data = this.getCombinedData.apply(this, _.values(dayData));
			this.cache.save('data-day', this.data);
			// show
			this.showData.call(this, 'mainGraph');
		};

		/**
		 * Graph control handler
		 */
		App.handleLoadMonthData = function($form){
			var app = this;

			$form.loading(true);

			if (!this.dataTypes) {
				throw 'Data types not set';
			}
			if (!this.dataColors) {
				throw 'Data colors not set';
			}
			if (!this.dataPaths) {
				throw 'Data paths not set';
			}

			var types = _.rest(this.dataTypes);
			var paths = this.dataPaths;

			var basePath = this.option('baseUrl').concat('data/');
			var currPath = '';
			var baseDate;

			var year = this.Time.getCurrentYear();
			var month = this.Time.getCurrentMonth();

			var vals = $form.getValues();
			if (parseInt(vals.year) && parseInt(vals.month)) {
				year = vals.year;
				month = (vals.month.toString().length < 2 ? '0' : '').concat(vals.month);
			}

			var dayData = [];
			var pass = false;

			$(paths).each(function(i, path){
				dayData[i] = [];
				currPath = basePath.concat(path.toUpperCase(), '/', year, '/', month);
				$(_.values(_.range(1, 32))).each(function(x, day){
					// month data
					day = (day < 10 ? '0' : '').concat(day);

					$.ajax({
						url: currPath.concat('/', day, '.jso'),
						dataType: 'json',
						async: false,
						success: function(data){
							if (!data.h) {
								throw 'Expected day data series';
							}

							pass = true;
							baseDate = app.Time.getPath({
								year: year,
								month: month,
								day: day
							});
							$(app['get' + types[i] + 'Data'].call(app, data.h, baseDate, ' ', '00')).each(function(x, data) {
								dayData[i].push(data);
							});
						},
						error: function(){
//							console.log('failed to fetch: ' + month);
						}
					});
				});
			});

			$form.loading(false);

			if (!pass) {
				this.logger.show('No data for this date: ' + year.concat('/', month), this.logger.WARN);
				return;
			} else {
				this.logger.show('Loaded custom date: ' + year.concat('/', month), this.logger.SUCCESS);
			}

			// data setup
			this.data = this.getCombinedData.apply(this, dayData);
			this.cache.save('data-month', this.data);
			// show
			this.showData.call(this);
		};

		/**
		 * Graph control handler
		 */
		App.handleLoadYearData = function($form){
			var app = this;

			$form.loading(true);

			if (!this.dataTypes) {
				throw 'Data types not set';
			}
			if (!this.dataColors) {
				throw 'Data colors not set';
			}
			if (!this.dataPaths) {
				throw 'Data paths not set';
			}

			var types = _.rest(this.dataTypes);
			var paths = this.dataPaths;

			var basePath = this.option('baseUrl').concat('data/');
			var currPath = '';
			var baseDate;

			var year = this.Time.getCurrentYear();
			var vals = $form.getValues();
			if (parseInt(vals.year)) {
				year = vals.year;
			}

			var dayData = [];
			var pass = false;

			$(paths).each(function(i, path){
				dayData[i] = [];
				currPath = basePath.concat(path, '/', year);
				$(_.values(_.range(1, 13))).each(function(x, month){
					// month data
					month = (month < 10 ? '0' : '').concat(month);

					$.ajax({
						url: currPath.concat('/', month, '.jso'),
						dataType: 'json',
						async: false,
						success: function(data){
							if (!data.day) {
								throw 'Expected day data series';
							}

							pass = true;
							baseDate = app.Time.getPath({
								year: year,
								month: month
							});
							$(app['get' + types[i] + 'Data'].call(app, data.day, baseDate)).each(function(x, data) {
								dayData[i].push(data);
							});
						},
						error: function(){
//							console.log('failed to fetch:');
//							console.log(month);
						}
					});
				});
			});

			$form.loading(false);

			if (!pass) {
				this.logger.show('No data for this date: ' + year, this.logger.WARN);
				return;
			} else {
				this.logger.show('Loaded custom date: ' + year, this.logger.SUCCESS);
			}

			// data setup
			this.data = this.getCombinedData.apply(this, dayData);
			this.cache.save('data-year', this.data);
			// show
			this.showData.call(this);
		};

		App.createMainGraph = function(name){
			return new Graph();
		};

		// Datetime helper
		App.Time = {
			DAY: 86400000,
			HOUR: 3600000,
			MINUTE: 60000,
			SECOND:  1000,

			now: function(object){
				var ts = new Date();
				return _.isUndefined(object) ? ts.getTime() : ts;
			},

			getCurrentYear: function(){
				var y = (new Date()).getFullYear();
				return y.toString();
			},
			getCurrentMonth: function(){
				var m = (new Date()).getMonth() + 1;
				return (m < 10 ? '0' : '').concat(m);
			},
			getCurrentDay: function(){
				var d = (new Date()).getDate();
				return (d < 10 ? '0' : '').concat(d);
			},
			getCurrentHour: function(){
				var h = (new Date()).getHours();
				return (h < 10 ? '0' : '').concat(h);
			},
			getCurrentMinute: function(){
				var m = (new Date()).getMinutes();
				return (m < 10 ? '0' : '').concat(m);
			},
			getCurrentDate: function(){
				return this.getCurrentYear() + '/' + this.getCurrentMonth() + '/' + this.getCurrentDay();
			},
			getCurrentDatetime: function(){
				return this.getCurrentDate() + ' ' + this.getCurrentHour() + ':' + this.getCurrentMinute();
			},
			getYear: function(date){
				return date.getFullYear().toString();
			},
			getMonth: function(date){
				var m = date.getMonth() + 1;
				return (m < 10 ? '0' : '').concat(m);
			},
			getMonthPath: function(date){
				return this.getYear(date) + '/' + this.getMonth(date);
			},
			getDay: function(date){
				var d = date.getDate();
				return (d < 10 ? '0' : '').concat(d);
			},
			getHour: function(date){
				var h = date.getHours();
				return (h < 10 ? '0' : '').concat(h);
			},
			getMinute: function(date){
				var m = date.getMinutes();
				return (m < 10 ? '0' : '').concat(m);
			},
			getDate: function(date){
				date = date || new Date();
				return this.getYear(date) + '/' + this.getMonth(date) + '/' + this.getDay(date);
			},
			getDatetime: function(date){
				date = date || new Date();
				return this.getDate(date) + ' ' + this.getHour(date) + ':' + this.getMinute(date);
			},
			/**
			 * @param {Object}
			 * @return {String} [YYYY[/MM[/DD]]]
			 */
			getPath: function(values){
				var date = '';

				if (values.year) {
					date = date.concat(values.year);
				}
				if (values.month && values.year) {
					date = date.concat('/', (values.month.toString().length < 2 ? '0' : '').concat(values.month));
				}
				if (values.day && values.month && values.year) {
					date = date.concat('/', (values.day.toString().length < 2 ? '0' : '').concat(values.day));
				}

				return date;
			},
			/**
			 * @param {String} time '1 minute|2 hour|7 day'
			 * @param {Date} date [optional]
			 * @return {Date}
			 */
			add: function(time, date){
				var tx = time.match(/([+-]+\d+)?\s?([a-z]+)/i);
				var ts = (date || new Date()).getTime();

				switch (tx[2]) {
					case 'second':
						ts += (tx[1] || 1) * this.SECOND;
					break;
					case 'minute':
						ts += (tx[1] || 1) * this.MINUTE;
					break;
					case 'hour':
						ts += (tx[1] || 1) * this.HOUR;
					break;
					case 'day':
						ts += (tx[1] || 1) * this.DAY;
					break;
					default:
						throw 'Value doesnt match: ' + time.toString();
					break;
				}

				return new Date(ts);
			}
		};

		App.Data = {
			/**
			 * On-off sanitizer
			 * @param {Number} val
			 * @return {Number|NaN}
			 */
			sigmaSanitizer: function(val){
				return (val === -999) ? NaN : 100;
			},
			/**
			 * Precise sanitizer
			 * @param {Number} val
			 * @return {Number|NaN}
			 */
			preciseSanitizer: function(val){
				return (val === -999) ? NaN : Math.round(val/10, 1);
			},
			/**
			 * One tenth sanitizer
			 * @param {Number} val
			 * @return {Number|NaN}
			 */
			decadicSanitizer: function(val){
				return (val < 0) ? NaN : val / 10;
			}
		};

		/** @experimental */
		App.translate = function(items, dict){
			// single item
			if (_.isString(items)) {
				return _.isUndefined(dict[items]) ? null : dict[items];
			}

			// moar items
			var output = {};

			$(items).each(function(i, item){
				if (_.contains(_.keys(dict), item)) {
					output[item] = dict[item];
				}
			});

			return output;
		};


	// App singleton @todo instance?
	return _.extend(App, Configurable);
});
