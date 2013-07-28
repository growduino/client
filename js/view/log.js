// Visual logging
define(['jquery', 'underscore', 'backbone'], function(){
	var exports = Backbone.View.extend();

		exports.INFO = 'info';
		exports.ERROR = 'error';

		exports.messageTemplate = {};

		/**
		 * @param {Object) $(#logTerminal)
		 * @return fluent
		 */
		exports.start = function($el) {
			this.$el = $el;

			var $messageTemplate = $(this.$el.find('.log-message.template').detach());
				$messageTemplate.removeClass('template');

			this.messageTemplate = $messageTemplate.prop('outerHTML');	// olol

			return this;
		};

		/**
		 * @param {String} name
		 * @param {String} text
		 */
		exports.show = function(text, type){
			type = type || 'info';
			_.templateSettings = {interpolate : /\{(.+?)\}/g};

			var message = _.template(this.messageTemplate);
			var date = new Date();
			var time = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();

			this.$el.append($(message({
				'time': time,
				'text': text
			})).addClass(type));
		};

	return exports;
});


