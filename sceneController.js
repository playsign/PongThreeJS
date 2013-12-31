"use strict";
/*
 * 	@author Tapani Jamsa
 */

function SceneController() {
	// SCENE
	this.scene = new THREE.Scene();

	// CAMERA
	var SCREEN_WIDTH = window.innerWidth;
	var SCREEN_HEIGHT = window.innerHeight;
	var NEAR = -20000;
	var FAR = 20000;

	this.camera = new THREE.OrthographicCamera(-SCREEN_WIDTH / 2, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, -SCREEN_HEIGHT / 2, NEAR, FAR);
	this.scene.add(this.camera);
	this.camera.position.set(0, 300, -100); // (0, 1000, -375);
	this.camera.lookAt(this.scene.position);

	// LIGHT
	var light;

	light = new THREE.PointLight(0xffffff);
	light.position.set(-300, 300, -300);
	this.scene.add(light);

	// White directional light at half intensity shining from the top.
	light = new THREE.DirectionalLight(0xffffff, 1);
	light.position.set(300, 300, 300);
	this.scene.add(light);

	// SKYBOX
	var skyBoxGeometry = new THREE.CubeGeometry(10000, 10000, 10000);
	var skyBoxMaterial = new THREE.MeshBasicMaterial({
		color: 0x000000,
		side: THREE.BackSide
	});
	var skyBox = new THREE.Mesh(skyBoxGeometry, skyBoxMaterial);
	this.scene.add(skyBox);

	// AMMO.JS
	var collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
	var dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
	var overlappingPairCache = new Ammo.btDbvtBroadphase();
	var solver = new Ammo.btSequentialImpulseConstraintSolver();
	this.btWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
	this.btWorld.setGravity(new Ammo.btVector3(0, 0, 0));
	this.timeStep = 1 / 60; // time passed after last simulation. if timeStep is 0.1 then it will include 6 (timeStep / fixedTimeStep) internal simulations. It's important that timeStep is always less than maxSubSteps*fixedTimeStep, otherwise you are losing time
	this.maxSubSteps = 20; // 5
	this.fixedTimeStep = 1 / 240; // Internally simulation is done for some internal constant steps. fixedTimeStep ~~~ 0.01666666 = 1/60. If you are finding that your objects are moving very fast and escaping from your walls instead of colliding with them, then one way to help fix this problem is by decreasing fixedTimeStep. If you do this, then you will need to increase maxSubSteps to ensure the equation listed above is still satisfied. Say you want twice the resolution, you'll need twice the maxSubSteps,

	// PLAYERS
	this.playerAmount = 3;
	this.clientPlayerAmount = 0;
	this.oldPlayerAmount = this.playerAmount;
	this.playerAreas = [];
	this.playerAreaWidth = 100;

	// BALL
	var borderMaterial = new THREE.MeshLambertMaterial({
		color: 0x999999
	});

	this.ball = new Ball(this, borderMaterial);
	this.scene.add(this.ball.sphereMesh);

}

SceneController.prototype.btWorldUpdate = function(delta) {
	this.btWorld.stepSimulation(this.timeStep, this.maxSubSteps, this.fixedTimeStep);

	// ammo.js check collisions
	var numManifolds = this.btWorld.getDispatcher().getNumManifolds();

	for (var i = 0; i < numManifolds; i++) {
		var contactManifold = this.btWorld.getDispatcher().getManifoldByIndexInternal(i);
		var obA = contactManifold.getBody0();
		var obB = contactManifold.getBody1();

		var numContacts = contactManifold.getNumContacts();
		for (var j = 0; j < numContacts; j++) {
			var pt = contactManifold.getContactPoint(j);

			var ptB = pt.getPositionWorldOnB();

			var rbA = Ammo.wrapPointer(obA, Ammo.btRigidBody);
			var rbB = Ammo.wrapPointer(obB, Ammo.btCollisionObject);

			if (rbA.mesh !== null && rbB.mesh !== null) {
				if (rbA.mesh.name === "ball" && rbB.mesh.type === "box") {
					// console.log("ball collides a border 1");

					// rbB is a border
					this.ball.onCollision(rbB.mesh, ptB);
				} else if (rbB.mesh.name === "ball" && rbA.mesh.type === "box") {
					// console.log("ball collides a border 2");

					// rbA is a border
					this.ball.onCollision(rbA.mesh, ptB);
				}
			}
		}
	}
	this.ball.update(delta);
};

SceneController.prototype.updateScene = function() {
	if (this.playerAmount !== this.oldPlayerAmount) {
		this.generateScene();
	}
};

SceneController.prototype.generateScene = function() {
	// delete previous scene
	this.deleteScene();

	this.playerAmount = Math.round(this.playerAmount);

	this.ball.lastCollider = null;

	// ammo.js . Reset positions
	var transform = this.ball.collider.getCenterOfMassTransform();
	transform.setOrigin(new Ammo.btVector3(0, 0, 0));
	this.ball.collider.setCenterOfMassTransform(transform);

	// Angle in radians
	var radians = Math.PI * 2 / this.playerAmount;

	var radius = this.playerAmount; // * radiusTweak;
	var pivotPoint = 9; // 10 Push player area forward by width of the area

	// Two player tweak to remove gaps between player areas
	if (this.playerAmount === 2) {
		pivotPoint -= 5; // 4.5 , 5,5
	} else if (this.playerAmount === 3) {
		pivotPoint -= 0.5; //-0,5
	}

	// Calculate player area offset
	var tHypotenuse = radius;
	var tAngle = radians / 2;
	var tAdjacent = Math.cos(tAngle) * tHypotenuse;
	var playerAreaOffset = radius - tAdjacent;

	radius += radius - playerAreaOffset;

	for (var i = 0; i < this.playerAmount; i++) {
		radians = Math.PI * 2 / this.playerAmount * (i + 1);
		// var degree = 360 - (radians * (180 / Math.PI));

		var x = Math.cos(radians) * radius * pivotPoint;
		var z = Math.sin(radians) * radius * -1 * pivotPoint;

		var pa = new PlayerArea(new THREE.Vector3(x, 0, z), radians, i);

		this.playerAreas.push(pa);

		this.scene.add(pa.group);
	}

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
	refreshPlayersInfo();

	this.oldPlayerAmount = this.playerAmount;
};

SceneController.prototype.deleteScene = function() {

	for (var i = 0; i < this.playerAreas.length; i++) {
		// ammo.js
		this.btWorld.removeRigidBody(this.playerAreas[i].borderBottom.collider);
		this.btWorld.removeRigidBody(this.playerAreas[i].borderLeft.collider);
		this.btWorld.removeRigidBody(this.playerAreas[i].borderTop.collider);
		this.btWorld.removeRigidBody(this.playerAreas[i].racketMesh.collider);

		this.scene.remove(this.playerAreas[i].group);
	}

	this.playerAreas = [];
};

SceneController.prototype.getRandomColor = function() {
	return '#' + '000000'.concat(Math.floor(Math.random() * 16777215).toString(16)).substr(-6);
};