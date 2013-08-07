$(function() {
	$("#playButton")
		.css({
		"z-index": "2",
		"background-image": "url('images/smallButton.png')",	
		"position": "absolute",
		// "bottom": "50px",
		"top": window.innerHeight / 2 + 150,
		"left": window.innerWidth / 2 - 125,
		"width": "250px",
		"height": "48px",
		"font-size": "250%",
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