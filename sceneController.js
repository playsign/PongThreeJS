"use strict";
/*
 * 	@author Tapani Jamsa
 */

function SceneController() {
	this.gameDirector = new Director();
}

SceneController.prototype.getRandomColor = function() {
	return '#' + '000000'.concat(Math.floor(Math.random() * 16777215).toString(16)).substr(-6);
};

SceneController.prototype.refreshPlayersInfo = function(playerAmount) {

	$("#playersInfo").empty();
	for (var i = 0; i < playerAmount; i++) {

		var entityID = app.serverGameCtrl.dynamicComponent.playerAreas[i];
		var entity = app.dataConnection.scene.entityById(entityID);

		if (entity) {
			$("#playersInfo").append("<font color = " + entity.dynamicComponent.color + ">Player" + (i + 1) + ": " + entity.dynamicComponent.playerBalls + "</font><br>");
		}

	}
};

SceneController.prototype.showHelp = function() {
	this.gameDirector.setScreen(DirectorScreens.controls);
};

SceneController.prototype.lerp = function(a, b, t) {
	return a + (b - a) * t;
};
