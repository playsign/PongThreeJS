$(function() {

	$("#title")
		.css({
		"z-index": "2",
		"background": "rgba(0,0,0,0)",
		"opacity": "0.9",
		"position": "absolute",
		"top": "50px",
		"left": window.innerWidth / 2 - 250
	}) // adds CSS
	.append("<img width='500' height='150' src='images/title.png'/>")
		.toggle()



});