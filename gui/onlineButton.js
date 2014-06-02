$(function() {
	function updateOnlineButton() {
		var width = window.innerWidth * 0.25;
		var posX = (window.innerWidth / 2) - (width / 2);
		var posY = window.innerHeight * 0.8;
		var fontSize = width + "%";

		$("#onlineButton")
			.css({
			"z-index": "3",
			"background-image": "url('images/smallButton.png')",
			"position": "absolute",
			// "bottom": "50px",
			"top": posY,
			"left": posX,
			"width": width,
			"height": "auto",
			"font-size": fontSize,
			"color": "white"
		}) // adds CSS
	}

	$("#onlineButton")
		.button({
		label: "Connect"
	})
		.click(function() {
		// if not already connected
		PongApp.showHelp();
		if (!PongApp.tundraClient.isConnected()) {
			PongApp.connect(); //(16)
		}
	})

	$(window).on('resize', function() {
		updateOnlineButton();
	});

	updateOnlineButton();
});
