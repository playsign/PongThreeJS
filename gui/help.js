$(function() {
	$("#help")
		.text("") // sets text to empty
	.css({
		"z-index": "2",
		"background-image": "url('images/window.png')",
		"position": "absolute",
		"top": window.innerHeight / 2 - 250,
		"left": window.innerWidth / 2 - 250
	}) // adds CSS
	.append("<img width='500' height='500' src='images/help.png'/>")
		.toggle()
});