$(function() {
	var width = window.innerWidth * 0.05;

	$("#replayButton")
		.css({
		"z-index": "2",
		"background-image": "url('images/smallButton.png')",
		"position": "absolute",
		"bottom": "50px",
		"left": window.innerWidth / 2,
		"width": width,
		"height": width,
	}) // adds CSS
	.button({})
		.click(function() {
		gameDirector.setScreen(screens.game);
		generateScene();
	})
		.append("<img width='"+width+"' height='"+width+"' src='images/replayIcon.png'/>")
});