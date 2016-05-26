(function ($) {
    $.fn.circliful = function (method) {
		var argumentsToPass = Array.prototype.slice.call(arguments);
		if (typeof method == "object"){
			method = "init";
		}else {
			argumentsToPass.shift();
		}
		/**
		* Attach to each DOM element a Circliful Object and call the init method if there is no object attached
		* if the object already exists, call the given method with the given parameters
		*/
        return this.each(function (key,element) {
			if (typeof jQuery(element).data('circliful') == "undefined"){
				jQuery(element).data('circliful', new Circliful(jQuery(element)));
				method = "init";
				if (typeof $.fn.circliful.drawer !== "undefined"){
					argumentsToPass[0].drawer = new ($.fn.circliful.drawer)();
				}
			}
			jQuery(element).data('circliful')[method].apply(jQuery(element).data('circliful'),argumentsToPass);
		});
    };

	function CirclifulDrawer(){
		var parent;
		this.init = function(){
			this.canvas = $('<canvas></canvas>');
			parent.getHtmlContainer().append(this.canvas);
			this.getContext().translate(0.5,0.5);
		}
		this.setParent = function(prt){
			parent = prt;
		}
		/**
		* @private
		* Draw the frame for the current values
		*/
		this.draw = function(){
			var context = this.getContext();
			context.clearRect(0, 0, this.canvas.width(), this.canvas.height());

			if (parent.settings['background-fill']){
				context.beginPath();
	            context.arc(this.canvas.width()/2, this.canvas.height()/2, parent.settings['background-radius']-1,  this.getAngleFromValue(0), this.getAngleFromValue(parent.settings.total), false);
            	context.fillStyle = parent.settings['background-fill-color'];
	            context.fill();
			}
			context.beginPath();
            context.arc(this.canvas.width()/2, this.canvas.height()/2, parent.settings['background-radius']-parent.settings['background-width']/2,  this.getAngleFromValue(0), this.getAngleFromValue(parent.settings.total), false);
            context.strokeStyle = parent.settings['background-stroke-color'];
            context.lineWidth = parent.settings['background-width'];
			context.stroke();

			context.beginPath();
	        context.arc(this.canvas.width()/2, this.canvas.height()/2, parent.settings['foreground-radius']-parent.settings['foreground-width']/2, this.getAngleFromValue(0), this.getAngleFromValue(parent.currentValue), false);
	        context.strokeStyle = parent.settings['foreground-color'];
	        context.lineWidth = parent.settings['foreground-width'];
	        context.stroke();

		}
		/**
		* @private
		* Returns the context of the canvas
		*/
		this.getContext = function(){
			return this.canvas.get(0).getContext('2d')
		}
		this.setSize = function(width,height){
			this.canvas.attr({ width : width, height : height });
		}
		/**
		* @private
		* Calculate the angle corresponding to the given value
		*/
		this.getAngleFromValue = function(value){
			return (parent.settings['start-point']+value/parent.settings.total*parent.settings['max-angle'])*Math.PI;
		}
		
	}
	/**
	*	The Circliful Class
	*	Its creation requires a DOM element
	*/
	function Circliful(htmlContainer){
		var defaultSettings = {
		        "background-radius": 100,				/* Radius of the background circle */
		        "background-stroke-color": "#eee",		/* color of the outer background circle */
		        "background-width": 20,					/* width of the outer background circle */
		        "background-fill-color": "gray",		/* color of the inner background circle */
		        "background-fill": true,				/* is the inner background circle filled */

		        "foreground-color": "#61a9dc",			/* color of the foreground circle arc */
		        "foreground-radius": 90,				/* radius of the foreground circle arc */
		        "foreground-width": 20,					/* width of the foreground circle arc */

				"start-point" : -0.5,					/* start point for the foreground circle arc : is multiplied by Math.PI -0.5 corresponds to the top of a circle, 0 to the right point */
				"max-angle" : 2,						/* max angle for the foreground circle arc : is multiplied by Math.PI 1 corresponds to a half circle, 2 to a full circle */
				
				"time-between-frames" : 10,				/* milliseconds between each frame */

				"animation-step" : 1,					/* step of advance for each frame : given in pourcentage : 1-100 */
		        dimension: 250,							/* Dimension of the canvas element */

				"display-style" : "full",				/* Style of the display : full or half : used only to calculate the position and width of various texts */
				"circle-text-class" : "circle-text",	/* class applied to the DOM element containing the main circle text */
				"info-text-class" : "circle-info",		/* class applied to the DOM element containing the text info circle */

		        percent: 100,							/* value to be displayed */

				"use-total" : true,						/* true if the element functions with values / false if it works with percentages */
				total : 100,							/* the total used if the use-total = true */

				"icon-class" : "users",					/* class to be applied to the icon element */
				"icon-display" : false,					/* true to display the icon / false otherwise */

				getText : function(){					/*	method called to obtain the text of the main circle text */
					return this.getCurrentValue();
				},
				getInfoText : function(){				/*	method called to obtain the text of the info text */
					return "";
				},
				drawer : new CirclifulDrawer()

		    };
		this.circleText = $('<span></span>');
		this.infoText = $('<span></span>');
		this.icon = $('<i></i>');
		this.settings = {};
		this.currentValue = 0;
		this.targetValue = 0;
		this.valueReachedListenerList = [];

		/**
		* Method called on init of the object
		* Defines the options : default settings are overriden by given options that are overriden by data- attributes
		* Appends the various DOM elements
		* Updates the display
		*/
		this.init = function(options){
			this.settings = $.extend({},defaultSettings);
			for(var i in options){
				if (typeof this.settings[i] != "undefined"){
					this.settings[i] = options[i]
				}
			}
			
			var data = htmlContainer.data();
			for(var i in data){
				if (typeof this.settings[i] != "undefined"){
					this.settings[i]=htmlContainer.data(i);
				}
			}
			this.setDrawer(this.settings.drawer);
			htmlContainer.append(this.circleText);
			htmlContainer.append(this.infoText);
			this.circleText.append(this.icon);
			htmlContainer.addClass('circliful');
			this.setSize(this.settings.dimension);
			this.setDisplayStyle(this.settings['display-style']);
			this.setInfoText();
			this.setIconClass(this.settings['icon-class']);
			this.setIconDisplay(this.settings['icon-display']);
			if (this.settings['use-total']){
				this.animateToValue(this.settings.percent);
			}else {
				this.animateToPercentage(this.settings.percent);
			}
		}
		this.getHtmlContainer = function(){
			return htmlContainer;
		};
		/**
		* @public
		* Destroy the current circliful
		*/
		this.destroy = function(){
			htmlContainer.empty();
			htmlContainer.removeData('circliful');
			htmlContainer.removeClass('circliful');
		}
		
		/**
		* @private
		* Returns the context of the canvas
		*/
		this.setSetting = function(name,value){
			this.settings[name]=value;
			this.settings['drawer'].draw();
		}

		/**
		* Defines the drawing method
		*/
		this.setDrawer=function(drawer){
			this.settings['drawer']=drawer;
			drawer.setParent(this);
			drawer.init();
		}
		/**
		* Defines the use-total option
		*/
		this.setUseTotal=function(useTotal){
			this.settings['use-total']=useTotal;
		}
		/**
		* returns the use-total option
		*/
		this.usesTotal = function(){
			return this.settings['use-total'];
		}
		/**
		* Defines the total to be used
		*/
		this.setTotal = function(total){
			this.settings['total']=total;
		}
		/**
		* Adds an event listener for the value reached event : called when any value is reached
		*/
		this.addValueReachedListener = function(listener){
			this.valueReachedListenerList.push(listener);
		}
		/**
		* Go directly to the given value
		*/
		this.setValue = function(value){
			this.currentValue = value;
			this.targetValue = value;
			this.setText();
			this.settings['drawer'].draw();
			for(var i in this.valueReachedListenerList){
				this.valueReachedListenerList[i].apply(this);
			}
		}
		/**
		* Go directly to the given percentage
		*/
		this.setPercentage = function(percent){
			this.setTotal(100);
			this.setValue(percent);
		}
		/**
		* Returns the current Value
		*/
		this.getCurrentValue = function(){
			return this.currentValue;
		}
		/**
		* Returns the target Value
		*/
		this.getTargetValue = function(){
			return this.targetValue;
		}
		/**
		* Defines the dimension of the canvas
		*/
		this.setSize = function(dimension){
			htmlContainer.width(dimension);
			this.settings.dimension = dimension;
			this.settings['drawer'].setSize(dimension,dimension);
			this.adaptCircleTextLineHeight();
			this.adaptCircleInfoLineHeight();
		}
		/**
		* Defines the display style : full or half
		*/
		this.setDisplayStyle = function(style){
			this.settings['display-style'] = style;
			this.circleText.attr('class',this.settings['circle-text-class']+' circle-text-'+style);
			this.infoText.attr('class',this.settings['info-text-class']+' circle-info-'+style);
			this.adaptCircleTextLineHeight();
			this.adaptCircleInfoLineHeight();
		}
		/**
		* Defines the class of the main circle text DOM element
		*/
		this.setCircleTextClass = function(circleTextClass){
			this.settings['circle-text-class'] = circleTextClass;
			this.setDisplayStyle(this.settings['display-style']);
		}
		/**
		* Defines the class of the info text DOM element
		*/
		this.setInfoTextClass = function(infoTextClass){
			this.settings['info-text-class'] = infoTextClass;
			this.setDisplayStyle(this.settings['display-style']);
		}
		/**
		* Modifies the line height for the main circle text DOM element
		*/
		this.adaptCircleTextLineHeight = function(){
			var lineHeight = this.settings.dimension;
			if (this.settings['display-style']=="half"){
				lineHeight = this.settings.dimension / 1.4;
			}
			this.circleText.css({ 'line-height': lineHeight + 'px' });
		}
		/**
		* Modifies the line height for the info text DOM element
		*/
		this.adaptCircleInfoLineHeight = function(){
			var lineHeight = this.settings.dimension*1.25;
			if (this.settings['display-style']=="half"){
				lineHeight = this.settings.dimension / 1.1;
			}
			this.infoText.css({ 'line-height': lineHeight + 'px' });
		}
		/**
		* Creates an animation to the given value
		*/
		this.animateToValue = function(value){
			this.targetValue = value;
			var difference = this.targetValue-this.currentValue;
			this.direction = difference>0?1:(difference<0?-1:0);
			this.stepToAnimation();
		}
		/**
		* Creates an animation to the given percentage
		*/
		this.animateToPercentage = function(percent){
			this.setTotal(100);
			this.animateToValue(percent);
		}
		/**
		* @private
		* Makes a new step in the animation toward the target value
		*/
		this.stepToAnimation = function(){
			this.timer += this.settings['animation-step'];
			this.currentValue += this.settings['animation-step']*(this.settings.total/100)*this.direction;
			this.settings['drawer'].draw();
			this.setText();
			var parent = this;
			var animationRequester = function(time){
					if (typeof parent.lastFrameDate == "undefined"){
						parent.lastFrameDate = time;
					}
					if (time-parent.lastFrameDate>parent.settings['time-between-frames']){
						parent.lastFrameDate = time;
						parent.stepToAnimation();
						return;
					}
					requestAnimationFrame(animationRequester,parent);
				};
			if (this.currentValue*this.direction<this.targetValue*this.direction){
				requestAnimationFrame(animationRequester,this);
				return;
			}
			if (this.settings['use-total']){
				this.setValue(this.targetValue);
			}else {
				this.setValue(this.targetValue);
			}
			for(var i in this.valueReachedListenerList){
				this.valueReachedListenerList[i].apply(this);
			}
		}
		/**
		* Calls the text callback method to define the content of the main circle text DOM element
		*/
		this.setText = function(){ 
			this.circleText.html(this.settings.getText.apply(this));
			this.circleText.append(this.icon);
		};
		/**
		* Set the display status of the icon
		*/
		this.setIconDisplay = function(display){
			this.settings['icon-display']=display;
			this.icon.css({'display' : display?"inline":"none"});
		}
		/**
		* Set the class of the icon DOM Element
		*/
		this.setIconClass = function(classes){
			this.settings['icon-class'] = classes;
			this.icon.attr('class','fa '+classes);
		};
		/**
		* Calls the text callback method to define the content of the info text DOM element
		*/
		this.setInfoText = function(){ 
			this.infoText.html(this.settings.getInfoText.apply(this));
		};
		
	}
	
}(jQuery));

