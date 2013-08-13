/** Persistable (mixin)
 *
 *  Provides simple localStorage API.
 *  For "null or falsy" data items use Configurable mixin.
 */
define(['util/mx-base', 'underscore', 'backbone', 'localstorage'], function(Base){
	var Persistable = function(){
		/** @var {Backbone.LocalStorage} */
		this.storage = null;
		/** @var {String} */
		this.storageName = null;

		/**
		 * @param {String} name
		 * @return {Object} fluent
		 */
		this.getStore = function(name)
		{
			if (_.isEmpty(this.storage)) {
				throw 'Invalid state: Storage is not set for the entity. Use this.setStore(name) instead.';
			}

			return this.storage;
		};

		/**
		 * @param {String} name
		 * @return {Backnone.LocalStorage}
		 */
		this.setStore = function(name) {
			if (!_.isString(name)) {
				throw 'Invalid argument: storage name must be a string.';
			}

			this.storageName = name;
			this.storage = new Backbone.LocalStorage(name);
		}

		/**
		 * Storage item setter.
		 */
		this.save = function(key, data) {
			if (!_.isString(key)) {
				throw 'Invalid argument: key must be a string.';
			}

			if (!_.isEmpty(data)) {
				var storage = this.getStore(this.storageName).localStorage();
					storage.setItem(key, JSON.stringify(data));
			}

			return this;
		};

		/**
		 * Storage item getter.
		 * @param {String} key
		 * @param {Object} def [optional]
		 * @return {Object|null}
		 */
		this.load = function(key, def) {
			if (!_.isString(key)) {
				throw 'Invalid argument: key must be a string.';
			}

			var storage = this.getStore(this.storageName).localStorage();
			var data = storage.getItem(key);

			if (!_.isEmpty(data)) {
				return JSON.parse(data);
			}

			if (!_.isUndefined(def)) {
				return def;
			}

			return null;
		}
	};


	return _.extend(new Persistable(), Base);
});
