$(function() {
	var width = window.innerWidth * 0.5;
	var posX = (window.innerWidth / 2) - (width / 2);
	var posY = window.innerHeight * 0.2;

	$("#help")
		.text("") // sets text to empty
	.css({
		"z-index": "2",
		"background-image": "url('images/window.png')",
		"position": "absolute",
		"top": posY,
		"left": width / 2
	}) // adds CSS
	.append("<img width='"+width+"' height='auto' src='images/help.png'/>")
	// .toggle()
});