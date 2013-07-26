screens = {
	menu: 0,
	setup: 1,
	roomBrowser: 2,
	lobby: 3,
	controls: 4,
	game: 5,
	pause: 6,
	gameover: 7
}

director = function() {
	this.setScreen(screens.menu);
}

director.prototype.setScreen = function(newScreen) {
	if (this.screen != newScreen) {
		// *hide previous screen items
		this.currentScreen = newScreen;

		switch (this.currentScreen) {
			case 0: // MENU
				// *show title*
				// *show play button*
				// *show info button*
				// *show volume button*
				$("#playButton").toggle();
				$("#title").toggle();

				break;
			case 1: //  SETUP
				// *show setup*
				// *show ok button*
				break;
			case 2: //  ROOM BROWSER
				// *show rooms*
				// *show scrollbar*
				break;
			case 3: //  LOBBY
				// *show chat*
				// *show ready button*
				break;
			case 4: //  CONTROLS
				// *show controls*
				// *show ok button*
				console.log("controls");
				$("#playButton").hide();
				$("#title").hide();
				$("#okButton").show();
				$("#help").show();
				break;
			case 5: //  GAME SCENE
				// *generate scene*
				// *show pause button (if not online game)*
				// *show mini chat*
				// *show players infos

				$("#okButton").hide();
				$("#help").hide();

				generateScene();


				break;
			case 6: //  PAUSE
				// *show volume button*
				// *show pause button*
				// *show menu button*
				// *show replay button *
				// *show play button *
				break;
			case 7: //  GAME OVER
				// *show game over window*
				// *show ok button*
				break;
		}
	} else {
		console.log("screen already set");
	}
}

director.prototype.doNextScreen = function() {
	this.setScreen(this.currentScreen + 1);
}