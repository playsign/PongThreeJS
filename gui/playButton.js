$(function() {
	$("#playButton")
		.css({
		"z-index": "2",
		"background-image": "url('images/button.png')",
		"position": "absolute",
		"bottom": "50px",
		"left": window.innerWidth / 2 - 125,
		"width": "250px",
		"height": "50px",
		"font-size": "250%"
	}) // adds CSS
	.button({
		label: "PLAY"
	})
		.click(function() {
			gameDirector.setScreen(screens.controls);	
	})
		.toggle()
});