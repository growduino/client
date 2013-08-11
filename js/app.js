// Application bootstrap file
// - Growduino Client v 0.1 -


define(['view/log', 'util/mx-conf', 'util/mx-persist'],
/** @param {Object} Log Visual logger view */
function(Log, Configurable, Persistable){
	var exports = {};

		exports.VERSION = '0.1';
		exports.NAME = 'GrowduinoClient';

		/**
		 * @param {Object} options (mx-conf)
		 * @return fluent
		 */
		exports.init = function(options){
			this.config(options || {});

			Log.start();
			Log.show(this.NAME + ' ' + this.VERSION + ' starting..');

			var cache = _.extend({}, Persistable);
				cache.setStore('app-cache');
				// test
//				cache.save('foo', {name:'John'});
//				console.log(cache.load('foo'));
//				console.log(cache.load('bar'));

			return this;
		};


		var appConfigurable = _.extend(Configurable, exports);

	return appConfigurable;
});
