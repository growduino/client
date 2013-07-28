/**
 *	Application bootstrap file
 *  - Growduino Client v 0.1 -
 */
define(['view/log'], function(Log){
	var exports = {};

		exports.VERSION = '0.1';
		exports.NAME = 'GrowduinoClient';

		exports.options = {

		};

		/**
		 * @param {Object} options
		 * @return fluent
		 */
		exports.config = function(options){
			options = options || {};

			for (i in options) {
				this.options[i] = options[i];
			}

			return this;
		};

		/**
		 * @return fluent
		 */
		exports.init = function(){
			Log.start($('#log'));
			Log.show(this.NAME + ' ' + this.VERSION + ' starting..');

			//Log.show('Ready', Log.INFO);
			//Log.show('Oh we hav prblm', Log.ERROR);

			return this;
		};

	return exports;
});
