/** Configurable (mixin)
 *  Provides "options" property and associated methods.
 */
define([], function(){
	var exports = {};

		exports.NAME = 'Configurable mixin';

		exports.options = {};

		/**
		 * @param  {Object} options
		 * @return {Object} fluent
		 */
		exports.config = function(options) {
			for (var i in options) {
				this.options[i] = options[i];
			}

			return this;
		};

		/**
		 * Options getter/setter
		 *
		 * @param {String|Object} keys
		 * @param {Object} vals [optional]
		 */
		exports.option = function(keys, vals) {
			vals = vals || null;

			var option, value;

			if (_.isObject(keys) || _.isArray(keys) ) {
				// set multiple options
				for (var i in keys) {
					option = i;
					value  = keys[i];
					if (_.isString(option)) {
						this.options[option] = value;
					}
					else {
						console.warn('Numeric option not passed:' + option + '[' + value.toString() + ']')
					}
				}
			} else
			if (_.isString(keys) && !_.isEmpty(vals)) {
				option = keys;
				value = vals;

				this.options[option] = value;
			}
		};


	return exports;
});

