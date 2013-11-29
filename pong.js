/* -*- js-indent-level: 8 -*-

/*
*	Pong
* 	@author Tapani Jamsa
*	@author Erno Kuusela
*	@author Toni Alatalo
*	Date: 2013
*/

// "use strict";
/* jshint -W097, -W040 */
/* global THREE, THREEx, Ammo, window, Director, DirectorScreens, PlayerArea */
// MAIN

var sceneCtrl, orbitControls, touchController, stats, gui, gameDirector;
var keyboard = new THREEx.KeyboardState();
var clock = new THREE.Clock();

init();
update();

// FUNCTIONS

function init() {
	// SCENE
	sceneCtrl = new SceneController();

	// DAT GUI
	container = document.getElementById('ThreeJS');
	gui = new dat.GUI();
	/* using "this" here works only by accident? needs non-strict mode */
	gui.add(sceneCtrl, 'playerAmount').min(2).max(100).step(1).listen();
	gui.close();
	gui.domElement.style.position = 'absolute';
	gui.domElement.style.right = '0px';
	// gui.domElement.style.zIndex = 100;
	container.appendChild(gui.domElement);

	// RENDERER
	if (Detector.webgl)
		renderer = new THREE.WebGLRenderer({
			antialias: true
		});
	else
		renderer = new THREE.CanvasRenderer();
	renderer.setSize(window.innerWidth, window.innerHeight);

	container.appendChild(renderer.domElement);

	// EVENTS
	THREEx.WindowResize(renderer, sceneCtrl.camera);
	THREEx.FullScreen.bindKey({
		charCode: 'm'.charCodeAt(0)
	});

	// CONTROLS
	orbitControls = new THREE.OrbitControls(sceneCtrl.camera, renderer.domElement);
	orbitControls.userZoom = false;

	// TOUCH
	touchController = new TouchInputController();

	// STATS
	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.bottom = '0px';
	stats.domElement.style.zIndex = 100;
	container.appendChild(stats.domElement);

	gui.add(sceneCtrl.ball, 'speed').min(0.1).max(400).step(0.1).listen();

	gameDirector = new Director();
	//initNet(clientUpdate);
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
	stats.update();

	if (netRole === 'client') {
		clientUpdate();
	} else if (netRole === 'server') {
		serverUpdate(delta);
	} else if (netRole === null) {
		offlineUpdate(delta);
	}

	requestAnimationFrame(update);
	render();
}

// Update the scene
function clientUpdate() {
	sceneCtrl.updateScene();
}

function serverUpdate(delta) {
	var racketPositions = [];
	for (var i = 0; i < sceneCtrl.playerAreas.length; i++) {
		sceneCtrl.playerAreas[i].serverUpdate(delta, clientKeysPressed ? clientKeysPressed : [], clientTouch ? clientTouch : 0, clientID, i);
		racketPositions.push(sceneCtrl.playerAreas[i].racketMesh.position);
	}

	sceneCtrl.updateScene();
	sceneCtrl.btWorldUpdate(delta);

	serverNetUpdate(racketPositions, sceneCtrl.ball.sphereMesh.position, delta, sceneCtrl.playerAmount);
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
		if (sceneCtrl.clientPlayerAmount !== sceneCtrl.playerAmount && sceneCtrl.playerAreas[i].player.id === ThisPeerID) {
			var worldPos = new THREE.Vector3();
			worldPos.getPositionFromMatrix(sceneCtrl.playerAreas[i].borderLeft.matrixWorld);
			sceneCtrl.camera.position.x = worldPos.x;
			sceneCtrl.camera.position.z = worldPos.z;
			sceneCtrl.camera.lookAt(sceneCtrl.playerAreas[i].group.position);

			sceneCtrl.clientPlayerAmount = sceneCtrl.playerAmount; // Helps to prevent unnecessary camera position modification
		}
	}

	var inputs = {
		keyboard: readKeyboard(),
		touch: touchController.deltaPosition.x * touchController.swipeSpeed,
	};

	return inputs;
}

function render() {
	renderer.render(sceneCtrl.scene, sceneCtrl.camera);
}

function showHelp() {
	gameDirector.setScreen(DirectorScreens.controls);
}

function getRandomColor() {
	return '#' + '000000'.concat(Math.floor(Math.random() * 16777215).toString(16)).substr(-6);
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