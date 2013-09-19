$(function() {
	var width = window.innerWidth * 0.25;
	var posX = (window.innerWidth / 2) - (width / 2);
	var posY = window.innerHeight * 0.8;
	var fontSize = width + "%";

	$("#playButton")
		.css({
		"z-index": "2",
		"background-image": "url('images/smallButton.png')",	
		"position": "absolute",
		// "bottom": "50px",
		"top": posY,
		"left": posX,
		"width": width,
		"height": "auto",
		"font-size": fontSize,
		"color":"white"
	}) // adds CSS
	.button({
		label: "PLAY"
	})
		.click(function() {
		gameDirector.setScreen(screens.controls);
	})
		// .toggle()
});