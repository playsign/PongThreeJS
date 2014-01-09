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
		if (!(removables[i] instanceof THREE.PointLight || removables[i] instanceof THREE.PerspectiveCamera)) {
			removables[i].parent.remove(removables[i]);
		}
	}

	this.reservedRacket = undefined;
	this.reservedPlayerArea = undefined;
	this.dataConnection.scene.entities = {};

};

PongApp.prototype.logicInit = function() {

	// TOUCH
	this.touchController = new TouchInputController();

	// SCENE
	this.sceneCtrl = new SceneController();

	// CONTROLS
	// this.controls.userZoom = false;
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
					this.reservedRacket = this.dataConnection.scene.entityById(racketRef);
					this.reservedPlayerArea = entity;
					console.log("reserved racket: " + this.reservedRacket);
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

PongApp.prototype.onSceneGenerated = function() {
	this.reservedRacket = undefined;
	this.reservedPlayerArea = undefined;
};

init();