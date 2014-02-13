$(function() {
	function updateHelpOffline() {
		var width = window.innerWidth * 0.4;
		var posX = (window.innerWidth / 2) - (width / 2);
		var posY = window.innerHeight * 0.05;

		$("#helpOffline")
			.text("") // sets text to empty
		.empty().css({
			"z-index": "2",
			"background-image": "url('images/window.png')",
			"position": "absolute",
			"top": posY,
			"left": posX
		}) // adds CSS
		.append("<img width='" + width + "' height='auto' src='images/helpOffline.png'/>")
		// .toggle()
	}

	$(window).on('resize', function() {
		updateHelpOffline();
	});

	updateHelpOffline();
});
