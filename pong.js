"use strict";

/* -*- js-indent-level: 8 -*-

// For conditions of distribution and use, see copyright notice in LICENSE
/*
*	PongThreeJS
*	@author Tapani Jamsa
*	@author Erno Kuusela
*	@author Toni Alatalo
*	Date: 2013
*/

/* jshint -W097, -W040 */
/* global THREE, THREEx, Ammo, window, Director, DirectorScreens */

var sceneCtrl;
var app;

function init() {
	app = new PongApp();
	app.host = "10.10.3.28"; // IP of the Tundra server
	app.port = 2345; // and port of the server


	function getRandomInt(min, max) {
		return Math.floor(Math.random() * (max - min + 1) + min);
	}

	app.start();

	useSignals = true;

	// Custom app properties
	app.racketSpeed = 80;
	// app.playerAreaReserved = undefined;
	app.reservedRacket = undefined;
	app.reservedPlayerArea = undefined;
	app.reservedBorderLeft = undefined;
	app.playerAreaWidth = 100;

	app.dataConnection.loginData = {
		"name": Date.now().toString() + getRandomInt(0, 2000000).toString()
	}

	console.log("name: " + app.dataConnection.loginData.name);
}

function PongApp() {
	Application.call(this); // Super class
}

PongApp.prototype = new Application();
PongApp.prototype.constructor = PongApp;

PongApp.prototype.onConnected = function() {
	console.log("connected");
	this.connected = true;

	this.dataConnection.scene.actionTriggered.add(this.onSceneGenerated.bind(this));

	// this.onSceneGenerated();
};

PongApp.prototype.onDisconnected = function() {
	console.log("disconnected");
	this.connected = false;

	// Destroy scene objects
	var removables = [];
	var i = 0;
	for (i = 0; i < this.scene.children.length; i++) {
		if (this.scene.children[i] instanceof THREE.Object3D) {
			removables.push(this.scene.children[i]);
		}
	}

	for (i = 0; i < removables.length; i++) {
		if (!(removables[i] instanceof THREE.PointLight || removables[i] instanceof THREE.DirectionalLight || removables[i] instanceof THREE.PerspectiveCamera || removables[i] instanceof THREE.OrthographicCamera)) {
			removables[i].parent.remove(removables[i]);
		}
	}

	this.reservedRacket = undefined;
	this.reservedPlayerArea = undefined;
	this.reservedBorderLeft = undefined;
	this.dataConnection.scene.entities = {};

};

PongApp.prototype.logicInit = function() {

	// TOUCH
	this.touchController = new TouchInputController();

	// CAMERA
	var SCREEN_WIDTH = window.innerWidth;
	var SCREEN_HEIGHT = window.innerHeight;
	var NEAR = -20000;
	var FAR = 20000;

	this.camera = new THREE.OrthographicCamera(-SCREEN_WIDTH / 2, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, -SCREEN_HEIGHT / 2, NEAR, FAR);
	// this.scene.add(this.camera);
	this.camera.position.set(0, 200, 100); // (0, 1000, -375);
	this.camera.lookAt(this.scene.position);
	this.viewer.camera = this.camera;

	// LIGHT
	this.viewer.pointLight.position.set(-300, 300, -300);

	// White directional light at half intensity shining from the top.
	this.directionalLight = new THREE.DirectionalLight(0xffffff, 1);
	this.directionalLight.position.set(300, 300, 300);
	this.scene.add(this.directionalLight);

	// DIRECTOR
	this.gameDirector = new Director();

	// SCENE
	this.sceneCtrl = new SceneController();

	// CONTROLS
	// this.controls.userZoom = false;


	// OTHER
	// this.playerAmount = 0;
};

function sign(x) {
	return x > 0 ? 1 : x < 0 ? -1 : 0;
}

PongApp.prototype.logicUpdate = function(dt) {

	if (this.connected) {

		var serverSceneCtrl = this.dataConnection.scene.entityByName("SceneController");
		if (!this.reservedRacket && serverSceneCtrl) {
			for (var i = 0; i < serverSceneCtrl.dynamicComponent.playerAreas.length; i++) {
				var entityID = serverSceneCtrl.dynamicComponent.playerAreas[i];
				var entity = this.dataConnection.scene.entityById(entityID);
				if (entity && entity.dynamicComponent.playerID == this.dataConnection.loginData.name) {

					var racketRef = entity.dynamicComponent.racketRef;
					var borderLeftRef = entity.dynamicComponent.borderLeftRef;
					this.reservedRacket = this.dataConnection.scene.entityById(racketRef);
					this.reservedBorderLeft = this.dataConnection.scene.entityById(borderLeftRef);
					this.reservedPlayerArea = entity;
					// console.log("reserved racket: " + this.reservedRacket);

					// this.playerAmount = serverSceneCtrl.dynamicComponent.playerAreas.length;
					this.setCameraPosition(serverSceneCtrl.dynamicComponent.playerAreas.length);

					break;
				}
			}
		}

		// RACKET CONTROL
		if (this.reservedRacket !== undefined && (this.keyboard.pressed("left") || this.keyboard.pressed("right") || this.keyboard.pressed("a") || this.keyboard.pressed("d") || this.touchController.swiping /*&& delta.x !== 0)*/ )) {

			// Radian
			var rotation = (this.reservedPlayerArea.placeable.transform.rot.y + 90) * (Math.PI / 180);

			var racketForward = new THREE.Vector3();

			// Radian to vector3
			racketForward.x = Math.cos(rotation * -1);
			racketForward.z = Math.sin(rotation * -1);

			racketForward.normalize();

			// Racket's speed
			if (this.touchController.swiping) {
				// Touch / Mouse
				racketForward.multiplyScalar(this.racketSpeed * this.touchController.deltaPosition.x * this.touchController.swipeSpeed * -1);
				if (Math.abs(racketForward.length()) > this.racketSpeed) {
					racketForward.normalize();
					racketForward.multiplyScalar(this.racketSpeed);
				}
			} else {
				// Keyboard
				racketForward.multiplyScalar(this.racketSpeed);
			}

			// Read keyboard
			if (this.keyboard.pressed("left") || this.keyboard.pressed("a")) {
				racketForward.multiplyScalar(-1);
			}

			// Set a new velocity for the entity
			this.reservedRacket.rigidBody.linearVelocity = racketForward;
			// console.log(racketForward);

			// Inform the server about the change
			this.dataConnection.syncManager.sendChanges();
		}
	}
};

PongApp.prototype.setCameraPosition = function(playerAmount) {
	console.log("playerAmount" + playerAmount);

	// delete previous scene
	// this.deleteScene();

	playerAmount = Math.round(playerAmount);

	// this.ball.lastCollider = null;

	// // ammo.js . Reset positions
	// var transform = this.ball.collider.getCenterOfMassTransform();
	// transform.setOrigin(new Ammo.btVector3(0, 0, 0));
	// this.ball.collider.setCenterOfMassTransform(transform);

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

	// update the camera
	var gameAreaDiameter = (radius * 25 + (this.playerAreaWidth * 2)); // TODO 25 the magic number
	// console.log("gameAreaDiameter: " + gameAreaDiameter);

	var SCREEN_WIDTH = window.innerWidth;
	var SCREEN_HEIGHT = window.innerHeight;
	var ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT;

	if (SCREEN_HEIGHT < SCREEN_WIDTH) {
		this.camera.left = ASPECT * -gameAreaDiameter / 2;
		this.camera.right = ASPECT * gameAreaDiameter / 2;
		this.camera.top = gameAreaDiameter / 2;
		this.camera.bottom = -gameAreaDiameter / 2;
	} else {
		this.camera.left = -gameAreaDiameter / 2;
		this.camera.right = gameAreaDiameter / 2;
		this.camera.top = gameAreaDiameter / 2 / ASPECT;
		this.camera.bottom = -gameAreaDiameter / 2 / ASPECT;
	}

	this.camera.updateProjectionMatrix();

	// Players info
	// this.refreshPlayersInfo();

	// this.oldPlayerAmount = playerAmount;

	var playerAreaPos = new THREE.Vector3(this.reservedPlayerArea.placeable.transform.pos.x, this.reservedPlayerArea.placeable.transform.pos.y, this.reservedPlayerArea.placeable.transform.pos.z);
	var borderLeftPos = new THREE.Vector3(this.reservedBorderLeft.placeable.transform.pos.x, this.reservedBorderLeft.placeable.transform.pos.y, this.reservedBorderLeft.placeable.transform.pos.z);
	console.log(playerAreaPos);
	console.log(borderLeftPos);


	this.camera.position.x = playerAreaPos.x;
	this.camera.position.z = playerAreaPos.z;
	this.camera.lookAt(new THREE.Vector3());
};

PongApp.prototype.onSceneGenerated = function(scope, entity, action, params) {
	console.log("onSceneGenerated");

	// debugger;
	// var playerAmount = this.dataConnection.scene.entityByName("SceneController").dynamicComponent.playerAreas.length;
	// var playerAmount = 1;
	// if (action) {
	// 	this.playerAmount = action[1];
	// }

	this.setCameraPosition(action[1]);

	this.sceneCtrl.onSceneGenerated(this.playerAmount);
	this.reservedRacket = undefined;
	this.reservedPlayerArea = undefined;
};

init();