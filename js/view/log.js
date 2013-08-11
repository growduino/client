// Visual logger
define(['jquery', 'underscore', 'backbone'], function(){

	var configurable = require('util/mx-conf');

	var MessageModel = Backbone.Model.extend();
	var MessageList  = Backbone.Collection.extend({
		model: MessageModel
	});

	/** @var {Backbone.View} */
	var exports = {};

		exports.NAME = 'Logger';

		exports.INFO = 'info';
		exports.ERROR = 'error';

		exports.options = {
			messageCount: 5,
			messageTemplate: ''	// html string for _
		};

		/** @var {Backbone.Collection} */
		exports.messages = new MessageList();

		/**
		 * @param  {Object} $el
		 * @param  {Object} options [optional] #configurable mixin
		 * @return {Backbone.View} fluent
		 */
		exports.start = function($el, options) {
			this.$el = $el || $('#log');
			this.config(options || {});

			var $messageTemplate = $(this.$el.find('.log-message.template').detach());
				$messageTemplate.removeClass('template');

			if ($messageTemplate.size() === 0) {
				throw 'Message template not found!';
			}

			this.options.messageTemplate = $messageTemplate.prop('outerHTML');	// olol

			return this;
		};

		/**
		 * @param  {String} text
		 * @param  {String} type [optional]
		 * @return {Object} fluent
		 */
		exports.show = function(text, type){
			if (_.isEmpty(text)) {
				throw 'Invalid argument: text must not be empty';
			}

			// create message
			var date = new Date();
			var time = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
			var id = 'log-message-'.concat(this.messages.size() + 1);

			var data = new MessageModel({
				'time': time,
				'text': text,
				'id': id
			});

			this.messages.add(data);

			// append message using template
			var template = _.template(this.options['messageTemplate']);
			var message = $(template(data.toJSON()))
				.addClass(type || this.INFO)
				.hide();

			this.$el.prepend(message);

							 message.show('slow');

			// remove off-limit messages
			while (this.$el.find('.log-message').size() > this.options['messageCount']) {
				this.$el.find('.log-message:last').remove();

				// @todo remove from internal list too?
			}

			return this;
		};

		/**
		 * @return fluent
		 */
		exports.clear = function(){
			this.$el.empty();

			return this;
		};


	var logConfigurable = _.extend(configurable, exports);
//		console.log(logConfigurable);

	var logView = Backbone.View.extend(logConfigurable);
//		console.log(logView);

	// Enhanced view
	return new logView();
});


