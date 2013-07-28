/**
 *	Application bootstrap file
 *  - Growduino Client v 0.1 -
 */
define([], function(){
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
			console.log(this.NAME + ' ' + this.VERSION);

			return this;
		};

	return exports;
});
