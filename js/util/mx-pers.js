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
		 * @param {Array|Object}
		 * @return {Array}
		 */
		this.defaultSerializer = function(items){
			var serialized = [];
			var item;

			$(items).each(function(k, v){
				item = _.clone(v);
				item[0] = v[0].toString();
				serialized[k] = item;
			});

			return serialized;
		};

		/**
		 * @param {Array}
		 * @return {Array}
		 */
		this.defaultDeserializer = function(items){
			// @todo ?
			return items;
		};


		/**
		 * Storage getter.
		 *
		 * @return {Backbone.LocalStorage} storage
		 */
		this.getStore = function(){
			if (_.isEmpty(this.storage)) {
				throw 'Invalid state: Storage is not set for the entity. Use this.setStore(name) instead.';
			}

			return this.storage;
		};

		/**
		 * Storage setter.
		 *
		 * @param {String} name
		 * @return {Object} fluent
		 */
		this.setStore = function(name){
			if (!_.isString(name)) {
				throw 'Invalid argument: storage name must be a string.';
			}

			this.storageName = name;
			this.storage = new Backbone.LocalStorage(name);

			return this;
		};

		/**
		 * Storage item setter.
		 *
		 * @param {String} key
		 * @param {Object} data
		 * @param {Function} serializer [optional]
		 * @return {Object} fluent
		 *
		 */
		this.save = function(key, data, serializer){
			if (!_.isString(key)) {
				throw 'Invalid argument: key must be a string.';
			}

			serializer = serializer || this.defaultSerializer;

			if (!_.isEmpty(data)) {
				var storage = this.getStore().localStorage();
					storage.setItem(key, JSON.stringify(_.isFunction(serializer) ? serializer(data) : data));
			}

			return this;
		};

		/**
		 * Storage item getter.
		 *
		 * @param {String} key
		 * @param {Function} deserializer [optional]
		 * @return {Object|null}
		 */
		this.load = function(key, deserializer){
			if (!_.isString(key)) {
				throw 'Invalid argument: key must be a string.';
			}

			deserializer = deserializer || this.defaultDeserializer;

			var storage = this.getStore().localStorage();
			var data = storage.getItem(key);

			if (!_.isEmpty(data)) {
				data = JSON.parse(data);
				if (_.isFunction(deserializer)) {
					data = deserializer(data);
				}

				return data;
			}

			return null;
		};

		/** @return {Array} cache keys */
		this.keys = function(){
			var storage = this.getStore().localStorage();
			var keys = [], name;
			
			for (var i in _.range(0, storage.length)) {
				name = storage.key(i);
				if (name) {
					keys.push(name);
				}
			}

			return keys;
		};
	};


	return _.extend(new Persistable(), Base);
});
