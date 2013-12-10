$(function() {
	var width = window.innerWidth * 0.05;

	$("#continueButton")
		.css({
		"z-index": "3",
		"background-image": "url('images/smallButton.png')",
		"position": "absolute",
		"bottom": "50px",
		"left": window.innerWidth / 2 - (width * -1.5),
		"width": width,
		"height": width,
	}) // adds CSS
	.button({
	})
		.click(function() {
		app.sceneCtrl.gameDirector.setScreen(DirectorScreens.game);
	})
		.append("<img width='"+width+"' height='"+width+"' src='images/playIcon.png'/>")
});