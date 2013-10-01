$(function() {
	var width = window.innerWidth;
	var height = window.innerHeight / 2;
	var posY = window.innerHeight / 2;

	$("#touchArea")
		.css({
		"z-index": "2",
		"background": "rgba(0,0,0,0)",
		"opacity": "0.9",
		"position": "absolute",
		"top": posY,
		"left": 0,
		"width": width,
		"height": height,
	}) 


});