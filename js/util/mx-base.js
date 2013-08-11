/*
 * Mixin parent.
 */
define(['underscore'], function(){
	var exports = {};

		/**
		 * Requirements checker. Detects attribute/method collisions.
		 *
		 * @param {Object} object Entity to me mixed with.
		 */
		exports._check = function(object)
		{
			for (var i in this) {
				var name =  i.toString();
				// mixin functions cannot be overriden
				var methodCollision = _.isFunction(this[i]) && !_.isUndefined(object[i]);
				// constants / private vars (uppercase) cannot be overriden
				var attribCollision = _.has(object, i) && name.match(/^[_@]?[A-Z]+$/);

				if (methodCollision || attribCollision) {
					throw 'Invalid state: Configurable method/attribute collision. [@name] must be removed for clear mixing.'
						.replace('@name', name);
				}
			}
		}


	return exports;
});


