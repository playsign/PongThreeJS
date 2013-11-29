"use strict";
/*
* 	@author Tapani Jamsa
*/

function TouchInputController() {

	// var getPointerEvent, $touchArea;
	var scope = this;

	this.deltaPosition = {
		x: 0,
		y: 0
	};
	this.swiping = false;
	this.swipeSpeed = 0.12;

	this.$touchArea = $('#touchArea');
	this.touchStarted = false; // detect if a touch event is sarted
	this.currX = 0;
	this.currY = 0;
	this.cachedX = 0;
	this.cachedY = 0;

	function getPointerEvent(event) {
		return event.originalEvent.targetTouches ? event.originalEvent.targetTouches[0] : event;
	}

	//setting the events listeners
	this.$touchArea.on('touchstart mousedown', function(e) {
		// console.log("touch start");
		e.preventDefault();
		var pointer = getPointerEvent(e);
		// caching the current x
		scope.cachedX = scope.currX = pointer.pageX;
		// caching the current y
		scope.cachedY = scope.currY = pointer.pageY;
		// a touch event is detected      
		scope.touchStarted = true;
		// detecting if after 200ms the finger is still in the same position
		setTimeout(function() {
			if ((scope.cachedX === scope.currX) && !scope.touchStarted && (scope.cachedY === scope.currY)) {
				// Here you get the Tap event
			}
		}, 200);
	});
	this.$touchArea.on('touchend mouseup touchcancel', function(e) {
		// console.log("touch end");
		e.preventDefault();
		// here we can consider finished the touch event
		scope.touchStarted = false;
		scope.swiping = false;
		scope.deltaPosition.x = 0;
	});
	this.$touchArea.on('touchmove mousemove', function(e) {
		// console.log("touch move");
		e.preventDefault();
		var pointer = getPointerEvent(e);
		if (scope.touchStarted) {
			// here you are scope.swiping
			scope.swiping = true;

			scope.deltaPosition.x = (scope.currX - pointer.pageX);
			scope.deltaPosition.y = window.innerHeight * (scope.currY - pointer.pageY);
		}
		scope.currX = pointer.pageX;
		scope.currY = pointer.pageY;
		// console.log("scope.swiping" + scope.deltaPosition.x);
	});

}

// TouchInputController.prototype.getPointerEvent = function(event) {
// 	return event.originalEvent.targetTouches ? event.originalEvent.targetTouches[0] : event;
// };