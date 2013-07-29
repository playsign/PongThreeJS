screens = {
	menu: 0,
	setup: 1,
	roomBrowser: 2,
	lobby: 3,
	controls: 4,
	game: 5,
	gameMenu: 6,
	gameover: 7
}

director = function() {
	this.setScreen(screens.menu);
}

director.prototype.setScreen = function(newScreen) {
	if (this.screen != newScreen) {
		// *hide previous screen items
		$("#playButton").hide();
		$("#title").hide();
		$("#okButton").hide();
		$("#help").hide();
		$("#gameMenuButton").hide();
		$("#infoButton").hide();
		$("#continueButton").hide();
		$("#replayButton").hide();
		$("#menuButton").hide();


		this.currentScreen = newScreen;

		switch (this.currentScreen) {
			case 0: // MENU
				// *show title*
				// *show play button*
				// *show info button*
				// *show volume button*
				$("#playButton").show();
				$("#title").show();
				$("#infoButton").show();

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

				$("#okButton").show();
				$("#help").show();
				break;
			case 5: //  GAME SCENE
				// *generate scene*
				// *show game menu button*
				// *show mini chat*
				// *show players infos

				$("#gameMenuButton").show();

				// generateScene();


				break;
			case 6: //  GAME MENU (pause)
				// *show volume button*
				// *show game menu button*
				// *show menu button*
				// *show replay button *
				// *show continue button *
				$("#infoButton").show();
				$("#continueButton").show();
				$("#replayButton").show();
				$("#menuButton").show();


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