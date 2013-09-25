$(function() {
	var width = window.innerWidth * 0.25;
	var posX = (window.innerWidth / 2) - (width * -0.25);
	var posY = window.innerHeight * 0.8;
	var fontSize = width + "%";

	$("#onlineButton")
		.css({
		"z-index": "2",
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
	.button({
		label: "online"
	})
		.click(function() {
		// if not already connected
		if(peerConnections.length === 0){
			initNet(clientUpdate);
		}
		else {
			showHelp();
		}
	})
	// .toggle()
});