$(function() {
	$("#okButton")
		.css({
		"z-index": "3",
		"background-image": "url('images/button.png')",
		"position": "absolute",
		"top": window.innerHeight / 2 + 150,
		"left": window.innerWidth / 2 - 50,
		"width": "100px",
		"height": "50px",
		"font-size": "250%"
	}) // adds CSS
	.button({
		label: "OK"
	})
		.click(function() {
		gameDirector.doNextScreen();
	})
		.hide()
});