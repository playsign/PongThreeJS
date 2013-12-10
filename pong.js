/* -*- js-indent-level: 8 -*-

// For conditions of distribution and use, see copyright notice in LICENSE
/*
*	PongThreeJS
* 	@author Tapani Jamsa
*	@author Erno Kuusela
*	@author Toni Alatalo
*	Date: 2013
*/

// "use strict";
/* jshint -W097, -W040 */
/* global THREE, THREEx, Ammo, window, Director, DirectorScreens */

var sceneCtrl, p2pCtrl, orbitControls, touchController, gameDirector, viewer;
var keyboard = new THREEx.KeyboardState();
var clock = new THREE.Clock();

init();
update();

function init() {
	// TOUCH
	touchController = new TouchInputController();

	// DIRECTOR
	gameDirector = new Director();

	// SCENE
	sceneCtrl = new SceneController();

	// P2P
	p2pCtrl = new P2P();

	// VIEWER
	viewer = new ThreeView();

	// CONTROLS
	orbitControls = new THREE.OrbitControls(sceneCtrl.camera, viewer.renderer.domElement);
	orbitControls.userZoom = false;
}

function refreshPlayersInfo() {
	$("#playersInfo").empty();
	for (var i = 0; i < sceneCtrl.playerAmount; i++) {

		$("#playersInfo").append("<font color = " + sceneCtrl.playerAreas[i].player.color + ">Player" + (i + 1) + "</font>");
		switch (sceneCtrl.playerAreas[i].player.balls) {
			case 0:
				$("#playersInfo").append("<img width='Â¨12' height='12' src='images/ballIconRed.png'/> ");
				$("#playersInfo").append("<img width='12' height='12' src='images/ballIconRed.png'/> ");
				$("#playersInfo").append("<img width='12' height='12' src='images/ballIconRed.png'/> <br>");
				break;
			case 1:
				$("#playersInfo").append("<img width='Â¨12' height='12' src='images/ballIcon.png'/> ");
				$("#playersInfo").append("<img width='12' height='12' src='images/ballIconRed.png'/> ");
				$("#playersInfo").append("<img width='12' height='12' src='images/ballIconRed.png'/> <br>");
				break;
			case 2:
				$("#playersInfo").append("<img width='Â¨12' height='12' src='images/ballIcon.png'/> ");
				$("#playersInfo").append("<img width='12' height='12' src='images/ballIcon.png'/> ");
				$("#playersInfo").append("<img width='12' height='12' src='images/ballIconRed.png'/> <br>");
				break;
			case 3:
				$("#playersInfo").append("<img width='Â¨12' height='12' src='images/ballIcon.png'/> ");
				$("#playersInfo").append("<img width='12' height='12' src='images/ballIcon.png'/> ");
				$("#playersInfo").append("<img width='12' height='12' src='images/ballIcon.png'/> <br>");
				break;
		}
	}
}

// UPDATE FUNCTIONS

function update() {
	var delta = clock.getDelta(); // seconds

	orbitControls.update();
	viewer.stats.update();

	if (p2pCtrl.netRole === 'client') {
		clientUpdate();
	} else if (p2pCtrl.netRole === 'server') {
		serverUpdate(delta);
	} else if (p2pCtrl.netRole === null) {
		offlineUpdate(delta);
	}

	requestAnimationFrame(update);
	viewer.render();
}

// Update the scene

function clientUpdate() {
	sceneCtrl.updateScene();
}

function serverUpdate(delta) {
	var racketPositions = [];
	for (var i = 0; i < sceneCtrl.playerAreas.length; i++) {
		sceneCtrl.playerAreas[i].serverUpdate(delta, p2pCtrl.clientKeysPressed ? p2pCtrl.clientKeysPressed : [], p2pCtrl.clientTouch ? p2pCtrl.clientTouch : 0, p2pCtrl.clientID, i);
		racketPositions.push(sceneCtrl.playerAreas[i].racketMesh.position);
	}

	sceneCtrl.updateScene();
	sceneCtrl.btWorldUpdate(delta);

	p2pCtrl.serverNetUpdate(racketPositions, sceneCtrl.ball.sphereMesh.position, delta, sceneCtrl.playerAmount);
}

function offlineUpdate(delta) {
	for (var i = 0; i < sceneCtrl.playerAreas.length; i++) {
		sceneCtrl.playerAreas[i].offlineUpdate(delta);
	}

	sceneCtrl.updateScene();
	sceneCtrl.btWorldUpdate(delta);
}

// Callback from the server

function updateClient(msg) {
	// called in client mode (when we're just showing what server tells us).
	if (msg.dt === undefined || msg.ballpos === undefined || msg.racketspos === undefined)
		throw "update msg: missing properties";
	sceneCtrl.ball.sphereMesh.position = msg.ballpos;

	for (var i = 0; i < sceneCtrl.playerAreas.length; i++) {
		sceneCtrl.playerAreas[i].clientUpdate(msg);
		// Camera position. Server camera.lookAt in playerArea.js
		if (sceneCtrl.clientPlayerAmount !== sceneCtrl.playerAreas.length && sceneCtrl.playerAreas[i].player.id === p2pCtrl.ThisPeerID) {
			var worldPos = new THREE.Vector3();
			worldPos.getPositionFromMatrix(sceneCtrl.playerAreas[i].borderLeft.matrixWorld);
			sceneCtrl.camera.position.x = worldPos.x;
			sceneCtrl.camera.position.z = worldPos.z;
			sceneCtrl.camera.lookAt(sceneCtrl.playerAreas[i].group.position);

			sceneCtrl.clientPlayerAmount = sceneCtrl.playerAreas.length; // Helps to prevent unnecessary camera position modification
		}
	}

	var inputs = {
		keyboard: readKeyboard(),
		touch: touchController.deltaPosition.x * touchController.swipeSpeed,
	};

	return inputs;
}

function showHelp() {
	gameDirector.setScreen(DirectorScreens.controls);
}

function readKeyboard() {
	var pressed = [];

	function checkPressed(keyname) {
		if (keyboard.pressed(keyname))
			pressed.push(keyname);
	}

	checkPressed("left");
	checkPressed("right");
	checkPressed("a");
	checkPressed("d");
	// checkPressed("o");
	// checkPressed("p");

	return pressed;
}