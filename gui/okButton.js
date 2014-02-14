$(function() {
	function updateOkButton() {
		var width = window.innerWidth * 0.25;
		var posX = (window.innerWidth / 2) - (width / 2);
		var posY = window.innerHeight * 0.8;
		var fontSize = width + "%";

		$("#okButton")
			.css({
			"z-index": "3",
			"background-image": "url('images/button.png')",
			"position": "absolute",
			"top": posY,
			"left": posX,
			"width": width,
			"height": "auto",
			"font-size": fontSize,
			"color": "white"
		}); // adds CSS
	}

	$("#okButton")
		.button({
		label: "OK"
	})
		.click(function() {
		gameDirector.doNextScreen();
		sceneCtrl.generateScene();
	});
	// .hide()

	$(window).on('resize', function() {
		updateOkButton();
	});

	updateOkButton();
});
