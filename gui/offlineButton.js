$(function() {
	var width = window.innerWidth * 0.25;
	var posX = (window.innerWidth / 2) - (width * 1.25);
	var posY = window.innerHeight * 0.8;
	var fontSize = width + "%";

	$("#offlineButton")
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
		label: "offline"
	})
		.click(function() {
		netRole = null;
		gameDirector.setScreen(screens.controls);
	})
		// .toggle()
});