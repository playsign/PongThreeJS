$(function() {
	var width = window.innerWidth * 0.05;

	$("#menuButton")
		.css({
		"z-index": "3",
		"background-image": "url('images/smallButton.png')",
		"position": "absolute",
		"bottom": "50px",
		"left": window.innerWidth / 2 - (width * 1.5),
		"width": width,
		"height": width,
	}) // adds CSS
	.button({})
		.click(function() {
		app.dataConnection.client.disconnect();

		app.sceneCtrl.gameDirector.setScreen(DirectorScreens.menu);

	})
		.append("<img width='" + width + "' height='" + width + "' src='images/menuIcon.png'/>")
});