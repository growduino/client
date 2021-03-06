// Forms!
define(['underscore', 'backbone'], function(){

	return Backbone.View.extend({
		// Backbone overrirde

		/** @var {String} */
		tagName: 'form',

		/** @var {Object} */
		events: {},

		initialize: function(){
			// @wtf property overload bug: namespace introduced
			this.part[this.cid] = {};
		},

		/**
		 * @param {HTMLElement} parent
		 * @return {Backbone.View} fluent
		 */
		render: function(parent){
			this.$el.attr({
				'id': this.name
			});

			var $body = (this.getRenderer()).call(this);

			this.$el.html($body);

			if (_.isElement(parent) || _.isObject(parent)) {
				$(parent).append(this.$el);
			}

			return this;
		},

		/**
		 * Add delegated events
		 * @param {Object} events
		 * @return {Backbone.View} fluent
		 */
		addEvents: function(events) {
			if (_.isObject(events)) {
				events = _.extend(this.events, events);
				this.delegateEvents(events);
			}

			return this;
		},

		// Extensions

		/** @var {Number} display mode: +1=full, -1=compact */
		mode: +1,
		toggleMode: function(){
			var $body = this.$el.find('*:has(.caption)').next('tbody');

			if (+1 === this.mode) {
				this.mode = -1;
			}
			else if (-1 === this.mode) {
				this.mode = +1;
			}

			$body.toggle();

			return this;
		},

		/** @var {String|null} */
		name: null,
		/** @return {String|null} */
		getName: function(){
			return this.name;
		},
		/** @param {String} name
		 * @return {Backbone.View}
		 */
		setName: function(name){
			if (!_.isString(name)) {
				throw 'Form name must be string';
			}

			this.name = name;

			return this;
		},

		/** @var {String|null} */
		caption: null,
		/** @var {Boolean} */
		captionToggle: false,
		/** @return {String|null} */
		getCaption: function(){
			return this.caption;
		},
		/** @param {String} text
		 * @return {Backbone.View}
		 */
		setCaption: function(text, toggle){
			this.caption = text;
			this.captionToggle = !!toggle;
			return this;
		},
		/** @return {Object} jQ element */
		renderCaption: function(){
			if (this.caption) {
				var $caption = $('<tr>');
					$caption.append($('<th>').attr({
						'colspan': 2,
						'class': 'caption'
					}).html(this.caption));
			}

			if (this.captionToggle) {
				$caption.css('cursor', 'pointer');
				this.addEvents({
					'click .caption': this.toggleMode
				});
			}

			return $caption || null;
		},

		part: {},
		getPart: function(name){
			if (!_.isObject(this.part[this.cid][name])) {
				throw 'No such part: ' + name;
			}

			return this.part[this.cid][name];
		},
		addPart: function(name, $input, label){
			if (!_.isUndefined(this.part[this.cid][name])) {
				throw new 'Part already exists:' + name;
			}

			if (_.isUndefined(label) || _.isString(label)) {
				var $label = $('<label>').attr({
					'for': $input.attr('id')
				}).text(label || name);
			}

			var part = {
				'$input': $input,
				'$label': $label || null
			};

			this.part[this.cid][name] = part;

			return $input;
		},
		/** @param {String} name
		 * @return {String} form unique id
		 */
		getPartId: function(name){
			return this.name + '-' + name;
		},

		/** @var {Function} */
		renderer: null,
		/** @return {Function} */
		getRenderer: function(){
			return this.renderer || this.defaultRenderer;
		},
		/** @param {Function}
		 * @return {Backbone.View}
		 */
		setRenderer: function(cb){
			if (!_.isFunction(cb)) {
				throw 'Renderer callback is not a function';
			}

			this.renderer = cb;

			return this;
		},

		/**
		 * @param {Object} name:value pairs
		 * @param {Backbone.View}
		 */
		setValues: function(values){
			//var self  = this;
			var parts = this.part[this.cid];
			var names = _.keys(values);

			$(_.values(values)).each(function(i, value){
				if (!_.isObject(parts[names[i]])) {
					return;
				}

				var $input = parts[names[i]].$input;

				if ($input.is(':checkbox')) {
					$input.attr('checked', value);
				} else {
					$input.val(value);
				}
			});

			return this;
		},
		/** @return {Object} name:value pairs */
		getValues: function(){
			var values = {};
			var names = _.keys(this.part[this.cid]);

			$(_.values(this.part[this.cid])).each(function(i, part){
				values[names[i]] = part.$input.val();
			});

			return values;
		},

		reset: function(){
			this.$el.trigger('reset');
		},
		clear: function(){
			// @todo
		},

		/**
		 * @param {String} name
		 * @param {Object} attributes [optional]
		 * @return {Object} jQ input
		 */
		addText: function(name, label, attributes){
			if (!_.isString(name)) {
				throw 'Name must be specified';
			}

			var id = this.getPartId(name);
			var $input = $('<input>').attr(_.defaults(attributes || {}, {
				type: 'text',
				name: name
			})).attr('id', id);

			return this.addPart(name, $input, label);
		},

		/**
		 * @param {String} name
		 * @param {Object} attributes [optional]
		 * @return {Object} jQ textarea
		 */
		addTextArea: function(name, label, attributes){
			if (!_.isString(name)) {
				throw 'Name must be specified';
			}

			var id = this.getPartId(name);
			var $input = $('<textarea>').attr(_.defaults(attributes || {}, {
				name: name
			})).attr('id', id);

			return this.addPart(name, $input, label);
		},

		addSelect: function(name, label, items, attributes){
			if (!_.isString(name)) {
				throw 'Name must be specified';
			}

			var id = this.getPartId(name);
			var $input = $('<select>')
				.attr(_.defaults(attributes || {}, {
					name: name
				})).attr('id', id);

				if (_.isObject(items)) {
					for (var value in items) {
						$input.append($('<option>').val(value).text(items[value]));
					}
				}

			return this.addPart(name, $input, label);
		},

		/**
		 * @param {String} name
		 * @param {Object} attributes [optional]
		 * @return {Object} jQ input
		 */
		addButton: function(name, label, attributes){
			if (!_.isString(name)) {
				throw 'Name must be specified';
			}

			var id = this.getPartId(name);
			var $input = $('<input>').attr(_.defaults(attributes || {}, {
				type: 'button',
				name: name
			}))
			.attr('id', id)
			.val(label || name);

			return this.addPart(name, $input, null);
		},

		/**
		 * @param {String} name
		 * @param {Object} attributes [optional]
		 * @return {Object} jQ input
		 */
		addSubmit: function(name, label, attributes){
			return this.addButton(name, label, attributes)
						.attr('type', 'submit');
		},

		/**
		 * @param {String} name
		 * @param {Object} attributes [optional]
		 * @return {Object} jQ input
		 */
		addCheckbox: function(name, label, attributes){
			if (!_.isString(name)) {
				throw 'Name must be specified';
			}

			var id = this.getPartId(name);
			var $input = $('<input>').attr(_.defaults(attributes || {}, {
				type: 'checkbox',
				name: name
			})).attr('id', id);

			return this.addPart(name, $input, label);
		},

		/**
		 * @param {String} name
		 * @param {Object} attributes [optional]
		 * @return {Object} jQ input
		 */
		addHidden: function(name, attributes){
			if (!_.isString(name)) {
				throw 'Name must be specified';
			}

			var id = this.getPartId(name);
			var $input = $('<input>').attr(_.defaults(attributes || {}, {
				type: 'hidden',
				name: name
			})).attr('id', id);

			return this.addPart(name, $input);
		},

		/** Method for rendering parts
		 *	Renders to table
		 *
		 * @return {Function}
		 */
		defaultRenderer: function(){
			if (_.isUndefined(this.part[this.cid])) {
				throw 'Form parts not defined.';
			}

			var $table = $('<table>');
			var $tbody = $('<tbody>');

			$table.append(this.renderCaption());
			$table.append($tbody);

			var $row, $th, $td;
			$(_.values(this.part[this.cid])).each(function(name, part) {
				$th = $('<th>').append(part.$label);
				$td = $('<td>').append(part.$input);

				$row = $('<tr>');
				$row.append($th).append($td);

				if (part.$input.is('[type=hidden]')) {
					$row.hide();
				}

				$tbody.append($row);
			});

			this.$el.append($table);

			return $table;
		},

		/**
		 * All-in-Line renderer
		 *
		 * @return {Object} jQ element
		 */
		allInLineRenderer: function(){
			// all-in-line
			var $wrap = $('<div>');

			$wrap.append(this.renderCaption());

			$(_.values(this.part[this.cid])).each(function(i, part){
				$wrap.append(part.$label || null);
				$wrap.append(part.$input);
			});

			return $wrap;
		},

		/**
		 * @param {Boolean} mode Show/hide loading overlay
		 */
		loading: function(mode){
			var $spinner = this.$el.find('.loading');
			if ($spinner.size() === 0) {
				$spinner = $('<div>', {
					'class': 'loading'
				}).css({
					'position': 'absolute',
					'top': 0,
					'left': 0,
					'width': this.$el.width(),
					'height': this.$el.height(),
					'opacity': 0.7,
					'zIndex': +99
				});
			}

			if (mode) {
				this.$el.css({
					'position': 'relative'
				}).append($spinner);
			} else {
				$spinner.remove();
			}
		}

	});

});