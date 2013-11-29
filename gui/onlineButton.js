$(function() {
	var width = window.innerWidth * 0.25;
	var posX = (window.innerWidth / 2) - (width * -0.25);
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
	.button({
		label: "online"
	})
		.click(function() {
		// if not already connected
		if(p2pCtrl.peerConnections.length === 0){
			p2pCtrl.initNet(updateClient);
		}
		else {
			showHelp();
		}
	})
	// .toggle()
});