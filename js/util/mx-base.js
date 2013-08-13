/*
 * Mixin parent.
 */
define(['underscore'], function(){
	var Base = function(){
		/**
		 * Requirements checker. Detects attribute/method collisions.
		 *
		 * @param {Object} object Entity to me mixed with.
		 */
		this._check = function(object)
		{
			var name;
			for (var i in this) {
				name =  i.toString();
				// mixin functions cannot be overriden
				var methodCollision = _.isFunction(this[i]) && !_.isUndefined(object[i]);
				// constants / private vars (uppercase) cannot be overriden
				var attribCollision = _.has(object, i) && name.match(/^[_@]?[A-Z]+$/);

				if (methodCollision || attribCollision) {
					throw 'Invalid state: method/attribute collision. [@name] must be removed for clear mixing.'
						.replace('@name', name);
				}
			}
		};
	};

	return new Base();
});


