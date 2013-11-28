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

// standard global variables

// var container, scene, renderer, camera;
var sceneGen;

var controls, touchController, stats, gui;
// var SCREEN_WIDTH, SCREEN_HEIGHT, VIEW_ANGLE, ASPECT, NEAR, FAR;
var keyboard = new THREEx.KeyboardState();
var clock = new THREE.Clock();

var playerAmount = 3;
var clientPlayerAmount = 0;
var oldPlayerAmount = playerAmount;

var playerAreas = [];
var collidableMeshList = [];

var playerAreaWidth = 100; // TODO duplicated in playerArea

var borderMaterial;
var gameDirector;
// var ball;

init();
animate();

// FUNCTIONS

function init() {
	// SCENE
	sceneGen = new SceneGenerator();

	// DAT GUI
	container = document.getElementById('ThreeJS');
	gui = new dat.GUI();
	/* using "this" here works only by accident? needs non-strict mode */
	gui.add(this, 'playerAmount').min(2).max(100).step(1).listen();
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
	THREEx.WindowResize(renderer, sceneGen.camera);
	THREEx.FullScreen.bindKey({
		charCode: 'm'.charCodeAt(0)
	});

	// CONTROLS
	controls = new THREE.OrbitControls(sceneGen.camera, renderer.domElement);
	controls.userZoom = false;

	// TOUCH
	touchController = new TouchInputController();

	// STATS
	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.bottom = '0px';
	stats.domElement.style.zIndex = 100;
	container.appendChild(stats.domElement);


	gui.add(sceneGen.ball, 'speed').min(0.1).max(400).step(0.1).listen();


	gameDirector = new Director();
	//initNet(clientUpdate);
}

function deleteScene() {
	collidableMeshList = [];

	for (var i = 0; i < playerAreas.length; i++) {
		// ammo.js
		sceneGen.btWorld.removeRigidBody(playerAreas[i].borderBottom.collider);
		sceneGen.btWorld.removeRigidBody(playerAreas[i].borderLeft.collider);
		sceneGen.btWorld.removeRigidBody(playerAreas[i].borderTop.collider);
		sceneGen.btWorld.removeRigidBody(playerAreas[i].racketMesh.collider);

		sceneGen.remove(playerAreas[i].group);
	}

	playerAreas = [];
}

function generateScene() {
	// delete previous scene
	deleteScene();

	playerAmount = Math.round(playerAmount);

	sceneGen.ball.lastCollider = null;

	// ammo.js . Reset positions
	transform = sceneGen.ball.collider.getCenterOfMassTransform();
	transform.setOrigin(new Ammo.btVector3(0, 0, 0));
	sceneGen.ball.collider.setCenterOfMassTransform(transform);

	// Angle in radians
	var radians = Math.PI * 2 / playerAmount;

	var radius = playerAmount; // * radiusTweak;
	var pivotPoint = 9; // 10 Push player area forward by width of the area

	// Two player tweak to remove gaps between player areas
	if (playerAmount === 2) {
		pivotPoint -= 5; // 4.5 , 5,5
	} else if (playerAmount === 3) {
		pivotPoint -= 0.5; //-0,5
	}

	// Calculate player area offset
	var tHypotenuse = radius;
	var tAngle = radians / 2;
	var tAdjacent = Math.cos(tAngle) * tHypotenuse;
	var playerAreaOffset = radius - tAdjacent;

	radius += radius - playerAreaOffset;

	for (var i = 0; i < playerAmount; i++) {
		radians = Math.PI * 2 / playerAmount * (i + 1);
		// var degree = 360 - (radians * (180 / Math.PI));

		var x = Math.cos(radians) * radius * pivotPoint;
		var z = Math.sin(radians) * radius * -1 * pivotPoint;

		var pa = new PlayerArea(sceneGen.btWorld, new THREE.Vector3(x, 0, z), radians, i, touchController);

		playerAreas.push(pa);

		collidableMeshList.push(pa.borderBottom);
		collidableMeshList.push(pa.borderLeft);
		collidableMeshList.push(pa.borderTop);
		collidableMeshList.push(pa.racketMesh);

		sceneGen.scene.add(pa.group);
	}

	// update the camera
	var gameAreaDiameter = (radius * 25 + (playerAreaWidth * 2)); // TODO 25 the magic number
	// console.log("gameAreaDiameter: " + gameAreaDiameter);

	var SCREEN_WIDTH = window.innerWidth;
	var SCREEN_HEIGHT = window.innerHeight;
	var ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT;

	if (SCREEN_HEIGHT < SCREEN_WIDTH) {
		sceneGen.camera.left = ASPECT * -gameAreaDiameter / 2;
		sceneGen.camera.right = ASPECT * gameAreaDiameter / 2;
		sceneGen.camera.top = gameAreaDiameter / 2;
		sceneGen.camera.bottom = -gameAreaDiameter / 2;
	} else {
		sceneGen.camera.left = -gameAreaDiameter / 2;
		sceneGen.camera.right = gameAreaDiameter / 2;
		sceneGen.camera.top = gameAreaDiameter / 2 / ASPECT;
		sceneGen.camera.bottom = -gameAreaDiameter / 2 / ASPECT;
	}

	sceneGen.camera.updateProjectionMatrix();

	// Players info
	refreshPlayersInfo();

	oldPlayerAmount = playerAmount;
}

function refreshPlayersInfo() {
	$("#playersInfo").empty();
	for (var i = 0; i < playerAmount; i++) {

		$("#playersInfo").append("<font color = " + playerAreas[i].player.color + ">Player" + (i + 1) + "</font>");
		switch (playerAreas[i].player.balls) {
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

function animate() {
	requestAnimationFrame(animate);
	render();
	update();
}

function update() {
	// Refresh the scene if the player amount has changed
	var delta = clock.getDelta(); // seconds.

	if (playerAmount !== oldPlayerAmount) {
		generateScene();
	}

	controls.update();
	sceneGen.camera.up = new THREE.Vector3(0, 1, 0);
	stats.update();

	if (netRole === 'client')
		return;

	// online game mode
	if (netRole !== null) {
		var racketPositions = [];
		for (var i = 0; i < playerAreas.length; i++) {
			playerAreas[i].serverUpdate(delta, clientKeysPressed ? clientKeysPressed : [], clientTouch ? clientTouch : 0, clientID, i);
			racketPositions.push(playerAreas[i].racketMesh.position);
		}
	} else {
		// offline game mode
		for (var i = 0; i < playerAreas.length; i++) {
			playerAreas[i].offlineUpdate(collidableMeshList, delta);
		}
	}

	// Ammo.js btWorld update
	sceneGen.btWorldUpdate();


	sceneGen.ball.update(collidableMeshList, delta);

	// online game mode
	if (netRole !== null) {
		serverNetUpdate(racketPositions, sceneGen.ball.sphereMesh.position, delta, playerAmount);
	}
}

function render() {
	renderer.render(sceneGen.scene, sceneGen.camera);
}

function showHelp() {
	gameDirector.setScreen(DirectorScreens.controls);
}

function getRandomColor() {
	return '#' + '000000'.concat(Math.floor(Math.random() * 16777215).toString(16)).substr(-6);
}

function clientUpdate(msg) {
	// called in client mode (when we're just showing what server tells us).
	if (msg.dt === undefined || msg.ballpos === undefined || msg.racketspos === undefined)
		throw "update msg: missing properties";
	sceneGen.ball.sphereMesh.position = msg.ballpos;
	// ball.update(collidableMeshList, msg.dt);
	for (var i = 0; i < playerAreas.length; i++) {
		playerAreas[i].clientUpdate(msg);
		if (clientPlayerAmount !== playerAmount && playerAreas[i].player.id === ThisPeerID) {
			var worldPos = new THREE.Vector3();
			worldPos.getPositionFromMatrix(playerAreas[i].borderLeft.matrixWorld);
			sceneGen.camera.position.x = worldPos.x;
			sceneGen.camera.position.z = worldPos.z;
			sceneGen.camera.lookAt(playerAreas[i].group.position);

			clientPlayerAmount = playerAmount; // Helps to prevent unnecessary camera position modification
		}
	}

	var inputs = {
		keyboard: readKeyboard(),
		touch: touchController.deltaPosition.x * touchController.swipeSpeed,
	};

	return inputs;
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