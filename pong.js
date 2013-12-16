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

// var sceneCtrl, p2pCtrl, orbitControls, touchController, gameDirector, viewer;
var sceneCtrl;
var app;
var debugTundra = true;

// // var keyboard = new THREEx.KeyboardState();
// // var clock = new THREE.Clock();

function init() {
	app = new PongApp();
	app.host = "10.10.2.13";
	app.port = 2345;

	app.start();

	if (debugTundra) {
		app.viewer.useCubes = true;
		useSignals = true;
	}
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

	// VIEWER
	// this.viewer = new ThreeView(this.scene, this.camera);

	// P2P
	// this.p2pCtrl = new P2P(this.sceneCtrl);

	// CONTROLS
	// this.controls.userZoom = false;

	// this.update();

	// if (debugTundra) {
	// useCubes = true;
	// useSignals = true;
	// this.sceneCtrl.playerAmount = 2;
	// this.sceneCtrl.generateScene();
	// }
};

// UPDATE FUNCTIONS

PongApp.prototype.logicUpdate = function() {
	if (debugTundra) {
		//
	} else if (this.p2pCtrl.netRole === 'client') {
		this.clientUpdate();
	} else if (this.p2pCtrl.netRole === 'server') {
		this.serverUpdate(delta);
	} else if (this.p2pCtrl.netRole === null) {
		this.offlineUpdate(delta);
	}
}

// PongApp.prototype.start = function() {
// 	this.logicInit();
// 	this.frameCount = 0;
// 	this.update();

// 	if(debugTundra){
// 		this.sceneCtrl.playerAmount = 2;
// 		this.sceneCtrl.generateScene();
// 	}
// };

// PongApp.prototype.update = function() {
// 	var delta = this.clock.getDelta(); // seconds

// 	this.logicUpdate();
// 	this.dataToViewerUpdate();

// 	this.orbitControls.update();
// 	this.viewer.stats.update();

// 	if(debugTundra){
// 		//
// 	}
// 	else if (this.p2pCtrl.netRole === 'client') {
// 		this.clientUpdate();
// 	} else if (this.p2pCtrl.netRole === 'server') {
// 		this.serverUpdate(delta);
// 	} else if (this.p2pCtrl.netRole === null) {
// 		this.offlineUpdate(delta);
// 	}

// 	var scope = this;
// 	requestAnimationFrame(function() {
// 		scope.update();
// 	});

// 	this.viewer.render();
// 	this.frameCount++;
// };

// PongApp.prototype.logicUpdate = function() {
// 	var posIncrement;
// 	this.viewer.checkDefined(this.frameCount);
// 	if (this.frameCount % 100 === 0) {
// 		posIncrement = 50;
// 	} else {
// 		posIncrement = -0.5;
// 	}
// 	for (var i = 0; i < this.testEntities.length; i++) {
// 		var ent = this.testEntities[i];
// 		this.viewer.checkDefined(ent);
// 		ent.components.placeable.transform.value.pos.y += posIncrement;
// 		ent.components.placeable.transform.value.rot.y += 0.01;
// 	}
// };

// PongApp.prototype.dataToViewerUpdate = function() {
// 	var sceneData = this.dataConnection.scene;
// 	for (var i in sceneData.entities) {
// 		if (!sceneData.entities.hasOwnProperty(i))
// 			continue;
// 		var entity = sceneData.entities[i];
// 		this.viewer.entitiesSeen[i] = true;
// 		this.viewer.checkDefined(entity);
// 		// if (entity.registeredWithViewer === true)
// 		//     continue;
// 		// else
// 		//     entity.registeredWithViewer = true;
// 		var placeable = entity.componentByType("Placeable");
// 		var meshes = [];
// 		var j;
// 		for (j in entity.components) {
// 			if (!entity.components.hasOwnProperty(j))
// 				continue;
// 			var comp = entity.components[j];
// 			this.viewer.checkDefined(comp);
// 			if (comp instanceof EC_Mesh)
// 				meshes.push(comp);
// 			else if (comp instanceof EC_Placeable)
// 				placeable = comp;
// 		}
// 		if (placeable !== null)
// 			for (j in Object.keys(meshes)) {
// 				this.viewer.entitiesWithMeshesSeen[i] = true;
// 				this.viewer.addOrUpdate(entity, placeable, meshes[j]);
// 		}
// 	}
// };

// Update the scene

// PongApp.prototype.clientUpdate = function() {
// 	this.sceneCtrl.updateScene();
// }

// PongApp.prototype.serverUpdate = function(delta) {
// 	var racketPositions = [];
// 	for (var i = 0; i < this.sceneCtrl.playerAreas.length; i++) {
// 		this.sceneCtrl.playerAreas[i].serverUpdate(delta, this.p2pCtrl.clientKeysPressed ? this.p2pCtrl.clientKeysPressed : [], this.p2pCtrl.clientTouch ? this.p2pCtrl.clientTouch : 0, this.p2pCtrl.clientID, i);
// 		racketPositions.push(this.sceneCtrl.playerAreas[i].racketMesh.position);
// 	}

// 	this.sceneCtrl.updateScene();
// 	this.sceneCtrl.btWorldUpdate(delta);

// 	this.p2pCtrl.serverNetUpdate(racketPositions, this.sceneCtrl.ball.sphereMesh.position, delta, this.sceneCtrl.playerAmount);
// }

// PongApp.prototype.offlineUpdate = function(delta) {
// 	for (var i = 0; i < this.sceneCtrl.playerAreas.length; i++) {
// 		this.sceneCtrl.playerAreas[i].offlineUpdate(delta);
// 	}

// 	this.sceneCtrl.updateScene();
// 	this.sceneCtrl.btWorldUpdate(delta);
// }

// Callback from the server

// PongApp.prototype.updateClient = function(msg) {
// 	// called in client mode (when we're just showing what server tells us).
// 	if (msg.dt === undefined || msg.ballpos === undefined || msg.racketspos === undefined)
// 		throw "update msg: missing properties";
// 	app.sceneCtrl.ball.sphereMesh.position = msg.ballpos;

// 	for (var i = 0; i < app.sceneCtrl.playerAreas.length; i++) {
// 		app.sceneCtrl.playerAreas[i].clientUpdate(msg);
// 		// Camera position. Server camera.lookAt in playerArea.js
// 		if (app.sceneCtrl.clientPlayerAmount !== app.sceneCtrl.playerAreas.length && app.sceneCtrl.playerAreas[i].player.id === app.p2pCtrl.ThisPeerID) {
// 			var worldPos = new THREE.Vector3();
// 			worldPos.getPositionFromMatrix(app.sceneCtrl.playerAreas[i].borderLeft.matrixWorld);
// 			app.sceneCtrl.camera.position.x = worldPos.x;
// 			app.sceneCtrl.camera.position.z = worldPos.z;
// 			app.sceneCtrl.camera.lookAt(app.sceneCtrl.playerAreas[i].group.position);

// 			app.sceneCtrl.clientPlayerAmount = app.sceneCtrl.playerAreas.length; // Helps to prevent unnecessary camera position modification
// 		}
// 	}

// 	var inputs = {
// 		keyboard: app.readKeyboard(),
// 		touch: app.touchController.deltaPosition.x * app.touchController.swipeSpeed,
// 	};

// 	return inputs;
// }

// PongApp.prototype.logicInit = function() {
// 	this.cubeCount = 0;
// 	var scene = this.dataConnection.scene;
// 	this.testEntities = [];
// 	console.log("in makeEntities");
// 	for (var i = 0; i < this.cubeCount; i++) {
// 		var ent = scene.createEntity(i + 1000);
// 		this.testEntities.push(ent);
// 		var placeable = ent.createComponent("placeable", "Placeable", "");
// 		var mesh = ent.createComponent("mesh", "Mesh", "placeable");
// 		placeable.transform.value.pos.x = i * 150;
// 		placeable.transform.value.pos.y = 150;

// 		setXyz(placeable.transform.value.scale, 1, 1, 1);
// 		mesh.meshRef.ref = "http://kek";
// 	}
// };

// PongApp.prototype.readKeyboard = function() {
// 	var pressed = [];

// 	function checkPressed(keyname) {
// 		if (app.keyboard.pressed(keyname))
// 			pressed.push(keyname);
// 	}

// 	checkPressed("left");
// 	checkPressed("right");
// 	checkPressed("a");
// 	checkPressed("d");
// 	// checkPressed("o");
// 	// checkPressed("p");

// 	return pressed;
// }

init();