$(function() {
	var width = window.innerWidth * 0.05;

	$("#menuButton")
		.css({
		"z-index": "2",
		"background-image": "url('images/smallButton.png')",
		"position": "absolute",
		"bottom": "50px",
		"left": window.innerWidth / 2 - (width * 1.5),
		"width": width,
		"height": width,
	}) // adds CSS
	.button({})
		.click(function() {
		gameDirector.setScreen(screens.menu);
		deleteScene();
	})
		.append("<img width='"+width+"' height='"+width+"' src='images/menuIcon.png'/>")
});