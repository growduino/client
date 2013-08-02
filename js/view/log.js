// Visual logger
define(['util/mx-conf', 'jquery', 'underscore', 'backbone'], function(configurable){
//	console.log(configurable);

	/** @var {Backbone.View} */
	var exports = {};

		exports.NAME = 'Logger';

		exports.INFO = 'info';
		exports.ERROR = 'error';

		exports.options = {
			messageCount: 5,
			messageTemplate: ''	// html string for _
		};

		exports.messages = [];

		/**
		 * @param  {Object} $el
		 * @param  {Object} options [optional] #configurable mixin
		 * @return {Backbone.View} fluent
		 */
		exports.start = function($el, options) {
			this.$el = $el;
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
			type = type || 'info';

			// append message using template
			var template = _.template(this.options['messageTemplate']);
			var date = new Date();
			var time = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();

			var data = {
				'time': time,
				'text': text
			};

			this.messages.push(data);

			var message = $(template(data))
				.addClass(type)
				.hide();

			this.$el.append(message);

							message.show('slow');

			// remove off-limit messages
			while (this.$el.find('.log-message').size() > this.options['messageCount']) {
				this.$el.find('.log-message:first').remove();
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


	// Enhanced view
	return _.extend(Backbone.View.extend({}), logConfigurable);
});


