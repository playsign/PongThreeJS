"use strict";

/* -*- js-indent-level: 8 -*-

// For conditions of distribution and use, see copyright notice in LICENSE
/*
*	PongThreeJS
* 	@author Tapani Jamsa
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
	app.host = "10.10.2.13";
	app.port = 2345;

	app.start();

	app.viewer.useCubes = true;
	useSignals = true;

	app.racketSpeed = 80;
	app.playerAreaReserved = undefined;
}

function PongApp() {
	Application.call(this);
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

PongApp.prototype.connectedCallback = function() {
	console.log("connected callback");

	// for (var i = 0; i < this.dataConnection.scene.entityByName("SceneController").dynamicComponent.attributes[0].valueInternal.length; i++) {
	// 	var entityID = this.dataConnection.scene.entityByName("SceneController").dynamicComponent.attributes[0].valueInternal[i];
	// 	if (this.dataConnection.scene.entityById(entityID).dynamicComponent.attributes[1].value === false) {
	// 		this.dataConnection.scene.entityById(entityID).dynamicComponent.attributes[1].value = true;
	// 		console.log("reserved playerArea: " + i);
	// 	}
	// }
};

PongApp.prototype.disconnectedCallback = function() {
	console.log("disconnected callback");
	// if (this.dataConnection.scene.entityById(this.playerAreaReserved)) {
	// 	this.dataConnection.scene.entityById(this.playerAreaReserved).dynamicComponent.attributes[0].value = false;
	// 	this.dataConnection.syncManager.sendChanges();
	// 	this.playerAreaReserved = undefined;
	// }
};

PongApp.prototype.logicUpdate = function(dt) {
	// console.log("update");
	// if(this.connected){
	// 	console.log("connected");
	// 	if(this.dataConnection.scene.entityByName("SceneController").dynamicComponent === null){
	// 		console.log("null");
	// 	}
	// 	else
	// 		console.log("not null");
	// }

	if (this.connected) {
		if (!this.playerAreaReserved && this.dataConnection.scene.entityByName("SceneController")) {
			for (var i = 0; i < this.dataConnection.scene.entityByName("SceneController").dynamicComponent.attributes[0].valueInternal.length; i++) {
				var entityID = this.dataConnection.scene.entityByName("SceneController").dynamicComponent.attributes[0].valueInternal[i];
				if (this.dataConnection.scene.entityById(entityID).dynamicComponent.attributes[0].value === false) {
					this.dataConnection.scene.entityById(entityID).dynamicComponent.attributes[0].value = true;
					console.log("reserved playerArea: " + i);
					this.playerAreaReserved = entityID;
					this.dataConnection.syncManager.sendChanges();
					break;
				}
			}
		}

		// RACKET CONTROL
		if (this.keyboard.pressed("left") || this.keyboard.pressed("right") || this.keyboard.pressed("a") || this.keyboard.pressed("d") || this.touchController.swiping /*&& delta.x !== 0)*/ ) {

			// var racketForward = new THREE.Vector3();
			var racketForward = 1;

			// TODO
			var entID = 7;
			if (this.playerAreaReserved == 4) {
				entID = 10;
				racketForward = -1;
			}

			// var tf = this.dataConnection.scene.entities[entID].placeable.transform;
			// var newValue = tf.value;

			var newValue = app.dataConnection.scene.entities[entID].rigidBody.linearVelocity.value;

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

			// Keyboard
			if (this.keyboard.pressed("left") || this.keyboard.pressed("a")) {
				// newValue.pos.z += deltaMovement;
				newValue.z = -this.racketSpeed * racketForward;

			}
			if (this.keyboard.pressed("right") || this.keyboard.pressed("d")) {
				// newValue.pos.z -= deltaMovement;
				newValue.z = this.racketSpeed * racketForward;
			}

			// // Touch
			// if (this.touchController.swiping) {
			// 	newValue.pos.z += deltaMovement;
			// }

			// this.dataConnection.scene.entities[entID].placeable.transform.set(newValue, 0);
			app.dataConnection.scene.entities[entID].rigidBody.linearVelocity.set(newValue, 0);
			this.dataConnection.syncManager.sendChanges();
		}
	}


}

// Update the scene

// PongApp.prototype.clientUpdate = function() {
// 	this.sceneCtrl.updateScene();
// }

init();