$(function() {
	$("#infoBox")
		.css({
		"background": "rgba(255,255,255,0.5)"
	})
		.dialog({
		autoOpen: false,
		show: {
			effect: 'fade',
			duration: 500
		},
		hide: {
			effect: 'fade',
			duration: 500
		}
	});

	function updateInfo() {
		var width = window.innerWidth * 0.05;

		$("#infoButton")
			.text("") // sets text to empty
		.empty().css({
			"z-index": "2",
			"background-image": "url('images/smallButton.png')",
			"position": "absolute",
			"top": "4px",
			"left": "4px"
		}) // adds CSS
		.append("<img width='" + width + "' height='" + width + "' src='images/infoIcon.png'/>");
	}

	$("#infoButton")
		.click(function() {
		$("#infoBox").dialog("open");
	});

	$(window).on('resize', function() {
		updateInfo();
	});

	updateInfo();
});
