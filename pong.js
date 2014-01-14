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
	app.reservedRacket = undefined;
	app.reservedPlayerArea = undefined;
	app.reservedBorderLeft = undefined;
	app.playerAreaWidth = 100;

	app.dataConnection.loginData = {
		"name": Date.now().toString() + getRandomInt(0, 2000000).toString()
	};

	console.log("name(id): " + app.dataConnection.loginData.name);

	// Custom mesh loaded callback
	app.viewer.onMeshLoaded = function(threeParent, meshComp, geometry, material) {
		console.log("custom onMeshLoaded")
		var newMaterial = new THREE.MeshFaceMaterial(material);

		var parentPlayerAreaID = meshComp.parentEntity.placeable.parentRef;
		if (parentPlayerAreaID !== "") {
			// var entity = this.dataConnection.scene.entityById(parentPlayerAreaID);
			var entity = meshComp.parentEntity.parentScene.entities[parentPlayerAreaID];
			newMaterial = new THREE.MeshLambertMaterial({
				color: entity.dynamicComponent.color
			});
		}

		if (geometry === undefined) {
			console.log("mesh load failed");
			return;
		}
		checkDefined(geometry, material, meshComp, threeParent);
		checkDefined(meshComp.parentEntity);
		check(threeParent.userData.entityId === meshComp.parentEntity.id);
		// console.log("Mesh loaded:", meshComp.meshRef.ref, "- adding to o3d of entity "+ threeParent.userData.entityId);
		checkDefined(threeParent, meshComp, geometry, material);
		var mesh = new THREE.Mesh(geometry, newMaterial);
		meshComp.threeMesh = mesh;
		//mesh.applyMatrix(threeParent.matrixWorld);
		mesh.needsUpdate = 1;
		threeParent.add(mesh);
		// threeParent.needsUpdate = 1;

		// do we need to set up signal that does
		// mesh.applyMatrix(threeParent.matrixWorld) when placeable
		// changes?
	};
}

function PongApp() {
	Application.call(this); // Super class
}

PongApp.prototype = new Application();

PongApp.prototype.constructor = PongApp;

PongApp.prototype.onConnected = function() {
	console.log("connected");
	this.connected = true;

	// Set callback function to know when the scene is (re)generated
	this.dataConnection.scene.actionTriggered.add(this.onSceneGenerated.bind(this));
};

PongApp.prototype.onDisconnected = function() {
	console.log("disconnected");
	this.connected = false;

	// DESTROY SCENE OBJECTS
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

	// Reset entity references
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

	// override camera
	this.camera = new THREE.OrthographicCamera(-SCREEN_WIDTH / 2, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, -SCREEN_HEIGHT / 2, NEAR, FAR);
	this.cameraPos = new THREE.Vector3(0, 300, 100);
	this.camera.position = this.cameraPos.clone();
	this.camera.lookAt(this.scene.position);
	this.viewer.camera = this.camera;

	// LIGHTS
	// override point light
	this.viewer.pointLight.position.set(-300, 300, -300);

	// White directional light at half intensity shining from the top.
	this.directionalLight = new THREE.DirectionalLight(0xffffff, 1);
	this.directionalLight.position.set(300, 300, 300);
	this.scene.add(this.directionalLight);

	// DIRECTOR (gui)
	this.gameDirector = new Director();

	// SCENE
	this.sceneCtrl = new SceneController();

	// CONTROLS
	this.controls.userZoom = false;
};

function sign(x) {
	return x > 0 ? 1 : x < 0 ? -1 : 0;
}

PongApp.prototype.logicUpdate = function(dt) {

	if (this.connected) {

		// Find a player area that matches with the player
		var serverSceneCtrl = this.dataConnection.scene.entityByName("SceneController");
		if (!this.reservedRacket && serverSceneCtrl) {
			for (var i = 0; i < serverSceneCtrl.dynamicComponent.playerAreas.length; i++) {
				var entityID = serverSceneCtrl.dynamicComponent.playerAreas[i];
				var entity = this.dataConnection.scene.entityById(entityID);
				if (entity && entity.dynamicComponent.playerID == this.dataConnection.loginData.name) {
					// Set player area entity references
					var racketRef = entity.dynamicComponent.racketRef;
					var borderLeftRef = entity.dynamicComponent.borderLeftRef;
					this.reservedRacket = this.dataConnection.scene.entityById(racketRef);
					this.reservedBorderLeft = this.dataConnection.scene.entityById(borderLeftRef);
					this.reservedPlayerArea = entity;

					// Set camera position and angle
					this.setCameraPosition(serverSceneCtrl.dynamicComponent.playerAreas.length);

					break;
				}
			}
		}

		// RACKET CONTROL
		if (this.reservedRacket !== undefined && this.reservedPlayerArea.placeable !== undefined && (this.keyboard.pressed("left") || this.keyboard.pressed("right") || this.keyboard.pressed("a") || this.keyboard.pressed("d") || this.touchController.swiping /*&& delta.x !== 0)*/ )) {
			// Get racket's direction vector

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

		// Players info
		if (serverSceneCtrl) {
			this.sceneCtrl.refreshPlayersInfo(serverSceneCtrl.dynamicComponent.playerAreas.length);
		}

	}
};

// Set camera position and angle
PongApp.prototype.setCameraPosition = function(playerAmount) {
	console.log("setCameraPosition");

	playerAmount = Math.round(playerAmount);

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

	// Get corresponding three objects
	var borderThreeObject = this.viewer.o3dByEntityId[this.reservedBorderLeft.id];
	var playerAreaThreeObject = this.viewer.o3dByEntityId[this.reservedPlayerArea.id];

	playerAreaThreeObject.updateMatrixWorld();
	borderThreeObject.updateMatrixWorld();
	var worldPos = new THREE.Vector3();
	worldPos.getPositionFromMatrix(borderThreeObject.matrixWorld);

	// Change camera position temporarily so we get a correct camera angle
	this.camera.position.x = worldPos.x;
	this.camera.position.y = this.cameraPos.y;
	this.camera.position.z = worldPos.z;
	this.camera.lookAt(playerAreaThreeObject.position);

	// Move camera back to the center
	this.camera.position = new THREE.Vector3(0, 10, 0);

};

// Scene generated callback
PongApp.prototype.onSceneGenerated = function(scope, entity, action, params) {
	console.log("onSceneGenerated");

	var playerAmount = action[1];

	this.setCameraPosition(playerAmount);
	this.reservedRacket = undefined;
	this.reservedPlayerArea = undefined;
};

init();