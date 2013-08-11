/** Configurable (mixin)
 *  Provides "options" property and associated methods.
 */
define(['util/mx-base', 'underscore'], function(Base){

	var exports = {};

		exports.options = {};

		/**
		 * Option getter.
		 *
		 * @param {String|Object} key
		 * @param {Object} def [optional]
		 */
		exports.option = function(key, def) {

			if (!_.isString(key)) {
				throw 'Invalid argument: "key" must be string';
			}

			return (this.options[key] || (def || null));
		};

		/**
		 * Options setter.
		 *
		 * @param  {Object|String} keys
		 * @param  {Object} vals [optional]
		 * @return {Object} fluent
		 */
		exports.config = function(keys, vals) {
			vals = vals || null;

			var option, value;

			if (_.isObject(keys) || _.isArray(keys)) {
				// set multiple options
				for (var i in keys) {
					option = i;
					value  = keys[i];
					if (_.isString(option) || _.isNumber(option)) {
						this.options[option] = value;
					}
					else {
						throw 'Invalid state: option key must be either string or number';
					}
				}
			} else
			if (_.isString(keys) && !_.isNull(vals)) {
				// set single option
				option = keys;
				value = vals;

				this.options[option] = value;
			}

			return this;
		};

		return _.extend(Base, exports);
});

