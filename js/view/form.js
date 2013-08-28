// Forms!
define(['underscore', 'backbone'], function(){

	var Form = function(){

		// Backbone.View
		this.tagName = 'form';

		/**
		 * @param {HTMLElement} parent
		 */
		this.render = function(parent){
			this.$el.attr({
				id: this.name
			});

			var $body = (this.getRenderer()).call(this);

			this.$el.html($body);

			if (_.isElement(parent) || _.isObject(parent)) {
				$(parent).append(this.$el);
			}

			return this.$el;
		};

		// Extensions

		/** @var {String} */
		this.name = null;
		this.getName = function(){
			return this.name;
		};
		this.setName = function(name){
			if (!_.isString(name)) {
				throw 'Form name must be string';
			}

			this.name = name;

			return this;
		};

		/** @var {String} */
		this.caption = null;
		this.getCaption = function(){
			return this.caption;
		};
		this.setCaption = function(text){
			this.caption = text;
		};

		this.part = {};
		this.getPart = function(name){
			if (!_.isObject(this.part[name])) {
				throw 'No such part: ' + name;
			}

			return this.part[name];
		};
		this.addPart = function(name, $input, label){
			if (!_.isUndefined(this.part[name])) {
				throw new 'Part already exists:' + name;
			}

			if (_.isUndefined(label) || _.isString(label)) {
				var $label = $('<label>').attr({
					'for': $input.attr('id')
				}).text(label || name);
			}

			this.part[name] = {
				'$input': $input,
				'$label': $label || null
			};

			return $input;
		};
		this.getPartId = function(name){
			return this.name + '-' + name;
		};

		/** @var {Function} */
		this.renderer = null;
		this.getRenderer = function(){
			return this.renderer || this.defaultRenderer;
		};
		this.setRenderer = function(cb){
			if (!_.isFunction(cb)) {
				throw 'Renderer callback is not a function';
			}

			this.renderer = cb;

			return this;
		};

		this.setValues = function(values){
			var self = this;
			var names = _.keys(values);
			$(_.values(values)).each(function(i, value){
				if (!_.isObject(self.part[names[i]])) {
					return;
				}

				var $input = self.part[names[i]].$input;

				if ($input.is(':checkbox')) {
					$input.attr('checked', value);
				} else {
					$input.val(value);
				}
			});

			return this;
		};
		this.getValues = function(){
			var values = {};
			var names = _.keys(this.part);

			$(_.values(this.part)).each(function(i, part){
				values[names[i]] = part.$input.val();
			});

			return values;
		};

		this.reset = function(){
			this.$el.trigger('reset');
		};

		this.clear = function(){
			// @todo
		};

		this.addText = function(name, label, attributes){
			if (!_.isString(name)) {
				throw 'Name must be specified';
			}

			var id = this.getPartId(name);
			var $input = $('<input>').attr(_.defaults(attributes || {}, {
				type: 'text',
				name: name
			})).attr('id', id);

			return this.addPart(name, $input, label);
		};

		this.addTextArea = function(name, label, attributes){
			if (!_.isString(name)) {
				throw 'Name must be specified';
			}

			var id = this.getPartId(name);
			var $input = $('<textarea>').attr(_.defaults(attributes || {}, {
				name: name
			})).attr('id', id);

			return this.addPart(name, $input, label);
		};

		this.addButton = function(name, label, attributes){
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
		};

		this.addSubmit = function(name, label, attributes){
			var $input = this.addButton(name, label, attributes);
				$input.attr('type', 'submit');

			return $input;
		};

		this.addCheckbox = function(name, label, attributes){
			if (!_.isString(name)) {
				throw 'Name must be specified';
			}

			var id = this.getPartId(name);
			var $input = $('<input>').attr(_.defaults(attributes || {}, {
				type: 'checkbox',
				name: name
			})).attr('id', id);

			return this.addPart(name, $input, label);
		};

		this.addHidden = function(name, attributes){
			if (!_.isString(name)) {
				throw 'Name must be specified';
			}

			var id = this.getPartId(name);
			var $input = $('<input>').attr(_.defaults(attributes || {}, {
				type: 'hidden',
				name: name
			})).attr('id', id);

			return this.addPart(name, $input);
		};

		this.defaultRenderer = function(){
			if (_.isUndefined(this.part)) {
				throw 'Form parts not defined.';
			}

			var $table = $('<table>');

			if (_.isString(this.caption)) {
				var $caption = $('<tr>');
					$caption.append($('<th>').attr({
						colspan: 2,
						class: 'caption'
					}).html(this.caption));

				$table.append($caption);
			}

			var $row, $th, $td;
			$(_.values(this.part)).each(function(name, part) {
				$th = $('<th>').append(part.$label);
				$td = $('<td>').append(part.$input);

				$row = $('<tr>');
				$row.append($th).append($td);

				if (part.$input.is('[type=hidden]')) {
					$row.hide();
				}

				$table.append($row);
			});

			this.$el.append($table);

			return $table;
		};
	};

	return Backbone.View.extend(new Form());
});
