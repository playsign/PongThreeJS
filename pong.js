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

// UPDATE FUNCTIONS

PongApp.prototype.logicUpdate = function(dt) {

	// RACKET CONTROL
	if (this.keyboard.pressed("left") || this.keyboard.pressed("right") || this.keyboard.pressed("a") || this.keyboard.pressed("d") || this.touchController.swiping /*&& delta.x !== 0)*/ ) {

		// var racketForward = new THREE.Vector3();

		var entID = 7;
		var tf = this.dataConnection.scene.entities[entID].placeable.transform;
		var newValue = tf.value;

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

		var deltaMovement = this.racketSpeed * dt;

		// Keyboard
		if (this.keyboard.pressed("left") || this.keyboard.pressed("a")) {
			newValue.pos.z += deltaMovement;
		}
		if (this.keyboard.pressed("right") || this.keyboard.pressed("d")) {
			newValue.pos.z -= deltaMovement;
		}

		// Touch
		if (this.touchController.swiping) {
			newValue.pos.z += deltaMovement;
		}

		this.dataConnection.scene.entities[entID].placeable.transform.set(newValue, 0);
		this.dataConnection.syncManager.sendChanges();
	}
}

// Update the scene

// PongApp.prototype.clientUpdate = function() {
// 	this.sceneCtrl.updateScene();
// }

init();