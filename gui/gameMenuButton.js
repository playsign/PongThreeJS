$(function() {
	$("#gameMenuButton")
		.css({
		"z-index": "3",
		"background-image": "url('images/smallButton.png')",
		"position": "absolute",
		"top":"4px", "left":"4px",
		"width": "48px",
		"height": "48px",
	}) // adds CSS
	.button({
	})
		.click(function() {
		gameDirector.setScreen(screens.gameMenu);
	})
		.append("<img width='48' height='48' src='images/gameMenuIcon.png'/>")
		// .toggle()
});