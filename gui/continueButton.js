$(function() {
	function updateContinueButton() {
		var width = window.innerWidth * 0.05;

		$("#continueButton")
			.empty().css({
			"z-index": "3",
			"background-image": "url('images/smallButton.png')",
			"position": "absolute",
			"bottom": "50px",
			"left": window.innerWidth / 2 - (width * -1.5),
			"width": width,
			"height": width,
		}) // adds CSS
		.append("<img width='" + width + "' height='" + width + "' src='images/playIcon.png'/>")
	}

	$("#continueButton")
		.button({})
		.click(function() {
		PongApp.gameDirector.setScreen(DirectorScreens.game);
	});

	$(window).on('resize', function() {
		updateContinueButton();
	});

	updateContinueButton();
});
