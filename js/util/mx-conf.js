/** Configurable (mixin)
 *  Provides "options" property and associated methods.
 */
define(['util/mx-base', 'underscore'], function(Base){

	var Configurable = function(){
		this.options = {};

		/**
		 * Option getter.
		 *
		 * @param {String|Object} key
		 * @param {Object} def [optional]
		 */
		this.option = function(key, def) {

			if (!_.isString(key)) {
				throw 'Invalid argument: "key" must be string';
			}

			if (_.isUndefined(this.options[key])) {
				return def || null;
			}

			return this.options[key];
		};

		/**
		 * Options setter.
		 *
		 * @param  {Object|String} keys
		 * @param  {Object} vals [optional]
		 * @return {Object} fluent
		 */
		this.config = function(keys, vals) {
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
			}
			else if (_.isString(keys) && !_.isUndefined(vals)) {
				// set single option
				option = keys;
				value = vals;

				this.options[option] = value;
			}

			return this;
		};
	};


	return _.extend(new Configurable(), Base);
});

