// Visual logger
define(['util/mx-conf', 'jquery', 'underscore', 'backbone'], function(Configurable){

//	console.log(Configurable);

	var MessageModel = Backbone.Model.extend();
	var MessageList  = Backbone.Collection.extend({
		model: MessageModel
	});

	/** @var {Backbone.View} */
	var Logger = function(name)
	{
		this.NAME = name || 'Logger';

		this.INFO = 'info';
		this.WARN = 'warn';
		this.ERROR = 'error';
		this.SYSTEM = 'system';

		this.defaultOptions = {
			messageCount: 5,
			templateSelector: '#log-message'
		};

		/** @var {String} */
		this.messageTemplate = '';	// loaded from html script template

		/** @var {Backbone.Collection} */
		this.messages = new MessageList();

		/**
		 * @param  {Object} options [optional] #configurable mixin
		 * @return {Backbone.View} fluent
		 */
		this.render = function(options) {
			this.config(_.defaults(options || {}, this.defaultOptions));

			var templateSelector = this.option('templateSelector');
			var $messageTemplate = $(templateSelector);

			if ($messageTemplate.size() === 0) {
				throw 'Message template [@name] not found!'
					.replace('@name', templateSelector);
			}

			this.messageTemplate = $messageTemplate.html();
			return this;
		};

		/**
		 * @param  {String} text
		 * @param  {String} type [optional]
		 * @return {Object} fluent
		 */
		this.show = function(text, type){
			if (_.isEmpty(text)) {
				throw 'Invalid argument: text must not be empty';
			}

			// create message
			var date = new Date();
			var time = (date.getHours()   < 10 ? '0' : '').concat(date.getHours()) + ':'
					 + (date.getMinutes() < 10 ? '0' : '').concat(date.getMinutes()) + ':'
					 + (date.getSeconds() < 10 ? '0' : '').concat(date.getSeconds());

			var id = 'log-message-'.concat(this.messages.size() + 1);

			var data = new MessageModel({
				'time': time,
				'text': text,
				'id': id
			});

			this.messages.add(data);

			// append message using template
			var template = _.template(this.messageTemplate);
			var $message = $(template(data.toJSON()))
				.removeClass('template')
				.addClass(type || this.INFO)
				.hide();

			this.$el.prepend($message);

				$message.show('slow');

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
		this.clear = function(){
			this.$el.empty();

			return this;
		};
	};

	Configurable._check(Logger);

	var logConfigurable = _.extend(new Logger(), Configurable);
//		console.log(logConfigurable);

	// Logger View (configurable)
	return Backbone.View.extend(logConfigurable);
});


