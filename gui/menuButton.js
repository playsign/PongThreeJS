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
		sceneCtrl.deleteScene();

		// online
		if (p2pCtrl.netRole != null) {
			// Close peer connections
		    for (var i = 0; i < p2pCtrl.peerConnections.length; i++) {
		    	p2pCtrl.peerConnections[i].close();
			    p2pCtrl.peerConnections.splice(i, 1);
	    	}
		    for (var i = 0; i < players.length; i++) {
			    players.splice(i, 1);
	    	}
	    	p2pCtrl.peerConnections = [];
			p2pCtrl.netRole = null;
			p2pCtrl.clientUpdateCallback = null;
			p2pCtrl.clientKeysPressed = null;
			p2pCtrl.clientTouch = null;
			id = null;
			p2pCtrl.ThisPeerID = null;
			p2pCtrl.clientID = null;
			p2pCtrl.serverID = null;
			p2pCtrl.timeOutTable = [];
		}

		})
		.append("<img width='"+width+"' height='"+width+"' src='images/menuIcon.png'/>")
});