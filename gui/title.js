$(function() {
	function updateTitle() {
		var width = window.innerWidth / 2;
		var posY = window.innerHeight * 0.1;

		$("#title")
			.empty().css({
			"z-index": "2",
			"background": "rgba(0,0,0,0)",
			"opacity": "0.9",
			"position": "absolute",
			"top": posY,
			"left": width / 2
		}) // adds CSS
		.append("<img width='" + width + "'' height='auto' src='images/title.png'/>")
		// .toggle()
	}

	$(window).on('resize', function() {
		updateTitle();
	});

	updateTitle();
});
