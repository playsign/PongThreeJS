$(function() {
	var width = window.innerWidth * 0.05;

	$("#gameMenuButton")
		.css({
		"z-index": "3",
		"background-image": "url('images/smallButton.png')",
		"position": "absolute",
		"top":"4px", "left":"4px",
		"width": width,
		"height": width,
	}) // adds CSS
	.button({
	})
		.click(function() {
		gameDirector.setScreen(screens.gameMenu);
	})
		.append("<img width='"+width+"' height='auto' src='images/gameMenuIcon.png'/>")
		// .toggle()
});