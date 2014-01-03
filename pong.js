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

	app.viewer.useCubes = true; // Use wireframe cube material for all objects
	useSignals = true;

	// Custom app properties
	app.racketSpeed = 80;
	// app.playerAreaReserved = undefined;
	app.reservedRacket = undefined;

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

PongApp.prototype.logicInit = function() {

	// TOUCH
	this.touchController = new TouchInputController();

	// SCENE
	this.sceneCtrl = new SceneController();

	// CONTROLS
	// this.controls.userZoom = false;
};

function sign(x) { return x > 0 ? 1 : x < 0 ? -1 : 0; }

PongApp.prototype.logicUpdate = function(dt) {

	if (this.connected) {

		if (!this.reservedRacket && this.dataConnection.scene.entityByName("SceneController")) {
			for (var i = 0; i < this.dataConnection.scene.entityByName("SceneController").dynamicComponent.attributeByName("playerAreas").valueInternal.length; i++) {
				var entityID = this.dataConnection.scene.entityByName("SceneController").dynamicComponent.attributeByName("playerAreas").valueInternal[i];
				var entity = this.dataConnection.scene.entityById(entityID);
				if (entity.dynamicComponent.attributeByName("playerID").value == this.dataConnection.loginData.name) {
					var racketRef = entity.dynamicComponent.attributeById("racketRef").value;
					this.reservedRacket = this.dataConnection.scene.entityById(racketRef);
					console.log("reserved racket: " + this.reservedRacket);
					break;
				}
			}
		}

		// RACKET CONTROL
		if (this.reservedRacket !== undefined && (this.keyboard.pressed("left") || this.keyboard.pressed("right") || this.keyboard.pressed("a") || this.keyboard.pressed("d") || this.touchController.swiping /*&& delta.x !== 0)*/ )) {

			// var racketForward = new THREE.Vector3();
			var racketForward = 1;

			// TODO
			if (this.reservedRacket.id === 10) {
				racketForward = -1;
			}

			// Get the original linear velocity of the rigidbody
			var newValue = this.reservedRacket.rigidBody.attributeByName("Linear velocity").value;

			// var rotation = this.racketMesh.rotation.y + (90 * (Math.PI / 180));

			// // Angle to vector3
			// racketForward.x = Math.cos(rotation * -1);
			// racketForward.z = Math.sin(rotation * -1);


			// racketForward.normalize();

			// // Racket's speed
			// if (this.touchController.swiping) {
			// 	// Touch / Mouse
			// 	racketForward.multiplyScalar(this.racketSpeed * this.touchController.deltaPosition.x * this.touchController.swipeSpeed * dt);
			// } else {
			// 	// Keyboard
			// 	racketForward.multiplyScalar(this.racketSpeed * dt);
			// }

			// var deltaMovement = this.racketSpeed * dt;

			// Read keyboard
			if (this.keyboard.pressed("left") || this.keyboard.pressed("a")) {
				// newValue.pos.z += deltaMovement;
				newValue.z = -this.racketSpeed * racketForward;

			}
			if (this.keyboard.pressed("right") || this.keyboard.pressed("d")) {
				// newValue.pos.z -= deltaMovement;
				newValue.z = this.racketSpeed * racketForward;
			}

			// Touch
			if (this.touchController.swiping) {
				// newValue.pos.z += deltaMovement;
				newValue.z = this.racketSpeed * this.touchController.deltaPosition.x * this.touchController.swipeSpeed;

				if(Math.abs(newValue.z) > this.racketSpeed){
					newValue.z = this.racketSpeed * sign(newValue.z);
				}

				newValue.z *= -1;
			}

			// Set a new velocity for the entity
			this.reservedRacket.rigidBody.linearVelocity.set(newValue, 0);
			// Inform the server about the change
			this.dataConnection.syncManager.sendChanges();
		}
	}


};

init();