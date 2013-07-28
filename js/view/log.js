// Visual logger

define(['jquery', 'underscore', 'backbone'], function(){
	var exports = Backbone.View.extend();

		exports.INFO = 'info';
		exports.ERROR = 'error';

		exports.options = {
			'messageCount': 5
		};
		exports.messageTemplate = {};

		/**
		 * @param  {Object} $el
		 * @param  {Object} options [optional]
		 * @return {Object} fluent
		 */
		exports.start = function($el, options) {
			this.$el = $el;
			this.config(options || {});

			var $messageTemplate = $(this.$el.find('.log-message.template').detach());
				$messageTemplate.removeClass('template');

			if ($messageTemplate.size() === 0) {
				throw 'Message template not found!';
			}

			this.messageTemplate = $messageTemplate.prop('outerHTML');	// olol

			return this;
		};

		/**
		 * @param  {Object} options
		 * @return {Object} fluent
		 */
		exports.config = function(options) {
			for (var i in options) {
				this.options[i] = options[i];
			}

			return this;
		}

		/**
		 * @param  {String} text
		 * @param  {String} type [optional]
		 * @return {Object} fluent
		 */
		exports.show = function(text, type){
			type = type || 'info';

			var message = _.template(this.messageTemplate);
			var date = new Date();
			var time = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();

			this.$el.append($(message({
				'time': time,
				'text': text
			})).addClass(type));

			while (this.$el.find('.log-message').size() > this.options.messageCount) {
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

	return exports;
});


