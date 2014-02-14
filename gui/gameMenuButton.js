$(function() {
	function updateGameMenuButton() {
		var width = window.innerWidth * 0.05;

		$("#gameMenuButton")
			.empty().css({
			"z-index": "3",
			"background-image": "url('images/smallButton.png')",
			"position": "absolute",
			"top": "4px",
			"left": "4px",
			"width": width,
			"height": width,
		}) // adds CSS
		.append("<img width='" + width + "' height='auto' src='images/gameMenuIcon.png'/>")
		// .toggle()
	}

	$("#gameMenuButton")
		.button({})
		.click(function() {
		app.sceneCtrl.gameDirector.setScreen(DirectorScreens.gameMenu);
	})

	$(window).on('resize', function() {
		updateGameMenuButton();
	});

	updateGameMenuButton();
});
