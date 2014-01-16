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

		// switch (this.playerAreas[i].player.balls) {
		// 	case 0:
		// $("#playersInfo").append("<img width='Â¨12' height='12' src='images/ballIconRed.png'/> ");
		// $("#playersInfo").append("<img width='12' height='12' src='images/ballIconRed.png'/> ");
		// $("#playersInfo").append("<img width='12' height='12' src='images/ballIconRed.png'/> <br>");
		// break;
		// case 1:
		// 	$("#playersInfo").append("<img width='Â¨12' height='12' src='images/ballIcon.png'/> ");
		// 	$("#playersInfo").append("<img width='12' height='12' src='images/ballIconRed.png'/> ");
		// 	$("#playersInfo").append("<img width='12' height='12' src='images/ballIconRed.png'/> <br>");
		// 	break;
		// case 2:
		// 	$("#playersInfo").append("<img width='Â¨12' height='12' src='images/ballIcon.png'/> ");
		// 	$("#playersInfo").append("<img width='12' height='12' src='images/ballIcon.png'/> ");
		// 	$("#playersInfo").append("<img width='12' height='12' src='images/ballIconRed.png'/> <br>");
		// 	break;
		// case 3:
		// 	$("#playersInfo").append("<img width='Â¨12' height='12' src='images/ballIcon.png'/> ");
		// 	$("#playersInfo").append("<img width='12' height='12' src='images/ballIcon.png'/> ");
		// 	$("#playersInfo").append("<img width='12' height='12' src='images/ballIcon.png'/> <br>");
		// 	break;
		// }
	}
};

SceneController.prototype.showHelp = function() {
	this.gameDirector.setScreen(DirectorScreens.controls);
};

SceneController.prototype.lerp = function(a, b, t) {
	return a + (b - a) * t;
};
