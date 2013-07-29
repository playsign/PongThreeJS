$(function() {
	$("#menuButton")
		.css({
		"z-index": "2",
		"background-image": "url('images/smallButton.png')",
		"position": "absolute",
		"bottom": "50px",
		"left": window.innerWidth / 2 - 60,
		"width": "48px",
		"height": "48px",
	}) // adds CSS
	.button({
	})
		.click(function() {
		gameDirector.setScreen(screens.menu);
		deleteScene();
	})
		.append("<img width='48' height='48' src='images/menuIcon.png'/>")
});