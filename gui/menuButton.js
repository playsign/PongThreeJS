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
		app.sceneCtrl.gameDirector.setScreen(DirectorScreens.menu);
		app.sceneCtrl.deleteScene();

		// online
		if (app.p2pCtrl.netRole != null) {
			// Close peer connections
		    for (var i = 0; i < app.p2pCtrl.peerConnections.length; i++) {
		    	app.p2pCtrl.peerConnections[i].close();
			    app.p2pCtrl.peerConnections.splice(i, 1);
	    	}
	    	// What is this?
		    // for (var i = 0; i < players.length; i++) {
			   //  players.splice(i, 1);
	    	// }
	    	app.p2pCtrl.peerConnections = [];
			app.p2pCtrl.netRole = null;
			app.p2pCtrl.clientUpdateCallback = null;
			app.p2pCtrl.clientKeysPressed = null;
			app.p2pCtrl.clientTouch = null;
			id = null;
			app.p2pCtrl.ThisPeerID = null;
			app.p2pCtrl.clientID = null;
			app.p2pCtrl.serverID = null;
			app.p2pCtrl.timeOutTable = [];
		}

		})
		.append("<img width='"+width+"' height='"+width+"' src='images/menuIcon.png'/>")
});