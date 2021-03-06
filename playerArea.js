"use strict";
/* -*- js-indent-level: 8 -*- */
/* jshint -W097, -W040 */
/*
 *	@author Tapani Jamsa
 */
/* global window, THREE, console,
   Player, Ammo, keyboard */

function PlayerArea(position, rotation, id, racketGeometry) {
	// Pointers to globals
	this.p2pCtrl = p2pCtrl;
	this.sceneCtrl = sceneCtrl;
	this.touchController = touchController;
	this.keyboard = keyboard;

	// PLAYER INFO
	if (this.p2pCtrl.netRole && p2pCtrl.playerArray[id]) {
		// online
		this.player = p2pCtrl.playerArray[id];
	} else {
		// offline
		var randomColor = this.sceneCtrl.getRandomColor();
		this.player = new Player(id, id, randomColor);
	}

	// PLAYER AREA
	this.id = id;

	this.group = new THREE.Object3D(); //create an empty container

	this.group.rotation.y = rotation;
	this.group.position = position;

	this.rotation = rotation;

	this.bottomTopWidth = this.sceneCtrl.playerAreaWidth;
	this.bottomTopHeight = 10;
	this.bottomTopGeometry = new THREE.CubeGeometry(this.bottomTopWidth, this.bottomTopHeight, this.bottomTopHeight, 1, 1, 1);
	this.leftWidth = 120;
	this.leftHeight = 10;
	this.leftGeometry = new THREE.CubeGeometry(this.leftWidth, this.bottomTopHeight, this.bottomTopHeight, 1, 1, 1);

	this.material = new THREE.MeshLambertMaterial({
		color: this.player.color
	});

	// BORDER BOTTOM 
	// Create mesh
	this.borderBottom = new THREE.Mesh(this.bottomTopGeometry, this.material);
	this.borderBottom.position.set(41.73959, 0, 55);
	this.borderBottom.rotation.y = 180 * (Math.PI / 180);
	this.borderBottom.name = "bottom";
	this.borderBottom.type = "box";

	// Create a physics model
	this.createPhysicsModel(this.bottomTopWidth, this.bottomTopHeight, this.borderBottom, false);

	// BORDER LEFT
	this.borderLeft = new THREE.Mesh(this.leftGeometry, this.material);
	this.borderLeft.position.set(96.05561, 0, 0);
	this.borderLeft.rotation.y = 270 * (Math.PI / 180);
	this.borderLeft.name = "left";
	this.borderLeft.type = "box";
	this.borderLeft.parentNode = this;

	// Create a physics model
	this.createPhysicsModel(this.leftWidth, this.leftHeight, this.borderLeft, false);
	// set it as ghost object
	this.borderLeft.collider.setCollisionFlags(4);

	// BORDER TOP
	this.borderTop = new THREE.Mesh(this.bottomTopGeometry, this.material);
	this.borderTop.position.set(41.73959, 0, -55);
	this.borderTop.rotation.y = 360 * (Math.PI / 180);
	this.borderTop.name = "top";
	this.borderTop.type = "box";

	// Create a physics model
	this.createPhysicsModel(this.bottomTopWidth, this.bottomTopHeight, this.borderTop, false);

	// PLAYER RACKET
	this.racketWidth = 30;
	this.racketHeight = 20;
	this.racketMesh = new THREE.Mesh(racketGeometry, this.material);
	this.racketMesh.position.set(76, 0, 4);
	this.racketMesh.rotation.y = 180 * (Math.PI / 180);
	this.racketMesh.name = "racket";
	this.racketMesh.type = "box";

	// Create a physics model
	this.racketSpeed = 80;
	this.racketTopStop = this.borderTop.position.z + (this.racketWidth / 2);
	this.racketBottomStop = this.borderBottom.position.z - (this.racketWidth / 2);
	this.createPhysicsModel(this.racketWidth, this.racketHeight, this.racketMesh, true);

	// GROUP
	this.groupMeshes = [];
	this.groupMeshes.push(this.borderBottom);
	this.groupMeshes.push(this.borderLeft);
	this.groupMeshes.push(this.borderTop);

	// CAMERA POSITION (for the server. client camera.lookAt in pong.js)
	if (this.p2pCtrl.netRole && this.p2pCtrl.playerArray[id] && this.p2pCtrl.serverID == this.player.id) {
		var worldPos = new THREE.Vector3();
		worldPos.getPositionFromMatrix(this.borderLeft.matrixWorld);
		this.sceneCtrl.camera.position.x = worldPos.x;
		this.sceneCtrl.camera.position.z = worldPos.z;
		this.sceneCtrl.camera.lookAt(position);
	}
}

PlayerArea.prototype.createPhysicsModel = function(width, height, mesh, racket) {
	var mass = width * height * height;
	var localInertia = new Ammo.btVector3(0, 0, 0);
	var w = width / 2;
	var h = height / 2;

	var shape = null;
	if (racket) {
		shape = new Ammo.btConvexHullShape();
		for (var i = 0; i < mesh.geometry.vertices.length; i++) {
			var point = mesh.geometry.vertices[i];

			shape.addPoint(new Ammo.btVector3(point.x, point.y, point.z));
		}
	} else {
		shape = new Ammo.btBoxShape(new Ammo.btVector3(w, h, h));
	}
	shape.calculateLocalInertia(mass, localInertia);

	// Local to world pos
	this.group.add(mesh);
	this.group.updateMatrixWorld();
	var worldPos = new THREE.Vector3();
	worldPos.getPositionFromMatrix(mesh.matrixWorld);
	var startTransform = new Ammo.btTransform();
	startTransform.setIdentity();
	startTransform.setOrigin(new Ammo.btVector3(worldPos.x, 0, worldPos.z));

	// Set rotation
	var worldRot = mesh.rotation.y + this.group.rotation.y;
	var quat = new Ammo.btQuaternion();
	quat.setEuler(worldRot, 0, 0); //or quat.setEulerZYX depending on the ordering you want
	startTransform.setRotation(quat);

	// Create a collision object
	var collisionObject = new Ammo.btCollisionObject();
	collisionObject.setWorldTransform(startTransform);
	collisionObject.setCollisionShape(shape);
	this.sceneCtrl.btWorld.addCollisionObject(collisionObject);
	collisionObject.mesh = mesh;
	collisionObject.setRestitution(1);
	collisionObject.setFriction(0);
	mesh.collider = collisionObject;
};

// ONLINE game mode
PlayerArea.prototype.serverUpdate = function(delta, clientKeyboard, clientTouch, playerID, i) {
	var lastPosition = this.racketMesh.position.clone();

	function checkPressed(scope, keyname, serverID, areaPlayerID) {
		if (keyname === null)
			return false;
		if (serverID == areaPlayerID) {
			return scope.keyboard.pressed(keyname);
		} else if (playerID == areaPlayerID) {
			return clientKeyboard.indexOf(keyname) != -1;
		}
		return false;
	}

	function checkTouch(scope, serverID, areaPlayerID) {
		if (serverID == areaPlayerID) {
			return scope.touchController.deltaPosition.x * scope.touchController.swipeSpeed;
		} else if (playerID == areaPlayerID) {
			return clientTouch;
		}
		return false;
	}

	// Racket controls
	var left_key = 'left',
		right_key = 'right';

	var racketForward = new THREE.Vector3();

	var rotation = this.racketMesh.rotation.y + (90 * (Math.PI / 180));

	// Angle to vector3
	racketForward.x = Math.cos(rotation * -1);
	racketForward.z = Math.sin(rotation * -1);


	racketForward.normalize();

	// Racket's speed
	racketForward.multiplyScalar(this.racketSpeed * delta);

	if (checkPressed(this, left_key, this.p2pCtrl.serverID, this.player.id)) {
		this.racketMesh.position.add(racketForward);
	} else if (checkPressed(this, right_key, this.p2pCtrl.serverID, this.player.id)) {
		this.racketMesh.position.sub(racketForward);
	}
	// Touch / Mouse
	else {
		var touchSpeedModifier = checkTouch(this, this.p2pCtrl.serverID, this.player.id);
		if (touchSpeedModifier !== 0) {
			racketForward.multiplyScalar(touchSpeedModifier);

			this.racketMesh.position.add(racketForward);
		}
	}

	// Local to world position
	var worldPos = new THREE.Vector3();
	worldPos.getPositionFromMatrix(this.racketMesh.matrixWorld);
	var transform = this.racketMesh.collider.getWorldTransform();
	transform.setOrigin(new Ammo.btVector3(worldPos.x, 0, worldPos.z));
	this.racketMesh.collider.setWorldTransform(transform);

	if (this.racketMesh.position.z < this.racketTopStop || this.racketMesh.position.z > this.racketBottomStop) {
		this.racketMesh.position = lastPosition;
	}
};

// ONLINE game mode
PlayerArea.prototype.clientUpdate = function(msg) {
	var newpos = msg.racketspos[this.id];
	if (newpos !== undefined)
		this.racketMesh.position = newpos;
	else
		console.log("undefined position for racket");
};

// OFFLINE game mode
PlayerArea.prototype.offlineUpdate = function(delta) {

	var lastPosition = this.racketMesh.position.clone();

	// Racket controls
	if (this.keyboard.pressed("left") || this.keyboard.pressed("right") || this.keyboard.pressed("a") || this.keyboard.pressed("d") || (this.touchController.swiping && delta.x !== 0)) {
		var racketForward = new THREE.Vector3();

		var rotation = this.racketMesh.rotation.y + (90 * (Math.PI / 180));

		// Angle to vector3
		racketForward.x = Math.cos(rotation * -1);
		racketForward.z = Math.sin(rotation * -1);


		racketForward.normalize();

		// Racket's speed
		if (this.touchController.swiping) {
			// Touch / Mouse
			racketForward.multiplyScalar(this.racketSpeed * this.touchController.deltaPosition.x * this.touchController.swipeSpeed * delta);
		} else {
			// Keyboard
			racketForward.multiplyScalar(this.racketSpeed * delta);
		}

		// Keyboard
		if (this.player.id == 1) {
			if (this.keyboard.pressed("left")) {
				this.racketMesh.position.add(racketForward);
			}
			if (this.keyboard.pressed("right")) {
				this.racketMesh.position.sub(racketForward);
			}

			// Touch
			if (this.touchController.swiping) {
				this.racketMesh.position.add(racketForward);
			}
		} else {
			if (this.keyboard.pressed("a")) {
				this.racketMesh.position.add(racketForward);
			}
			if (this.keyboard.pressed("d")) {
				this.racketMesh.position.sub(racketForward);
			}
		}

		// Local to world position
		var worldPos = new THREE.Vector3();
		worldPos.getPositionFromMatrix(this.racketMesh.matrixWorld);
		var transform = this.racketMesh.collider.getWorldTransform();
		transform.setOrigin(new Ammo.btVector3(worldPos.x, 0, worldPos.z));
		this.racketMesh.collider.setWorldTransform(transform);

		if (this.racketMesh.position.z < this.racketTopStop || this.racketMesh.position.z > this.racketBottomStop) {
			this.racketMesh.position = lastPosition;
		}
	}

};