$(function() {
	var width = window.innerWidth * 0.05;

	$("#menuButton")
		.css({
		"z-index": "3",
		"background-image": "url('images/smallButton.png')",
		"position": "absolute",
		"bottom": "50px",
		"left": window.innerWidth / 2 - (width * 1.5),
		"width": width,
		"height": width,
	}) // adds CSS
	.button({})
		.click(function() {
		gameDirector.setScreen(DirectorScreens.menu);
		deleteScene();

		// online
		if (netRole != null) {
			// Close peer connections
		    for (var i = 0; i < peerConnections.length; i++) {
		    	peerConnections[i].close();
			    peerConnections.splice(i, 1);
	    	}
		    for (var i = 0; i < players.length; i++) {
			    players.splice(i, 1);
	    	}
	    	peerConnections = [];
			netRole = null;
			clientUpdateCallback = null;
			clientKeysPressed = null;
			clientTouch = null;
			id = null;
			ThisPeerID = null;
			clientID = null;
			serverID = null;
			timeOutTable = [];
		}

		})
		.append("<img width='"+width+"' height='"+width+"' src='images/menuIcon.png'/>")
});