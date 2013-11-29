"use strict";

function SceneGenerator() {

	// var container, scene, renderer, camera;

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
	// light = new THREE.AmbientLight(0x999999); // soft white light
	// this.scene.add(light);

	light = new THREE.PointLight(0xffffff);
	light.position.set(-300, 300, -300);
	this.scene.add(light);

	// White directional light at half intensity shining from the top.
	light = new THREE.DirectionalLight(0xffffff, 1);
	light.position.set(300, 300, 300);
	this.scene.add(light);


	// FLOOR
	// var floorTexture = new THREE.ImageUtils.loadTexture('images/checkerboard.jpg');
	// floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
	// floorTexture.repeat.set(10, 10);
	// var floorMaterial = new THREE.MeshBasicMaterial({
	// 	map: floorTexture,
	// 	side: THREE.DoubleSide
	// });
	// var floorGeometry = new THREE.PlaneGeometry(1000, 1000, 10, 10);
	// var floor = new THREE.Mesh(floorGeometry, floorMaterial);
	// floor.position.y = -0.5;
	// floor.rotation.x = Math.PI / 2;
	// this.scene.add(floor);
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

	// PLAYERS
	this.playerAmount = 3;
	this.clientPlayerAmount = 0;
	this.oldPlayerAmount = this.playerAmount;

	// BALL
	var material = new THREE.MeshLambertMaterial({
		color: 0x999999
	});

	var borderMaterial = new THREE.MeshLambertMaterial({
		color: 0x999999
	});

	this.ball = new Ball(this.btWorld, borderMaterial);
	this.scene.add(this.ball.sphereMesh);

}

SceneGenerator.prototype.btWorldUpdate = function(delta) {
	// ammo.js step simulation
	var timeStep = 1 / 60; // time passed after last simulation. if timeStep is 0.1 then it will include 6 (timeStep / fixedTimeStep) internal simulations. It's important that timeStep is always less than maxSubSteps*fixedTimeStep, otherwise you are losing time
	var maxSubSteps = 20; // 5
	var fixedTimeStep = 1 / 240; // Internally simulation is done for some internal constant steps. fixedTimeStep ~~~ 0.01666666 = 1/60. If you are finding that your objects are moving very fast and escaping from your walls instead of colliding with them, then one way to help fix this problem is by decreasing fixedTimeStep. If you do this, then you will need to increase maxSubSteps to ensure the equation listed above is still satisfied. Say you want twice the resolution, you'll need twice the maxSubSteps,
	this.btWorld.stepSimulation(timeStep, maxSubSteps, fixedTimeStep);

	// ammo.js check collisions
	var numManifolds = this.btWorld.getDispatcher().getNumManifolds();
	// if(numManifolds > 0) {
	// 	console.log("numManifolds: "+numManifolds);
	// }

	for (var i = 0; i < numManifolds; i++) {
		var contactManifold = this.btWorld.getDispatcher().getManifoldByIndexInternal(i);
		var obA = contactManifold.getBody0();
		var obB = contactManifold.getBody1();

		var numContacts = contactManifold.getNumContacts();
		for (var j = 0; j < numContacts; j++) {
			var pt = contactManifold.getContactPoint(j);

			// console.log("pt.getDistance(): " + pt.getDistance());

			if (pt.getDistance() <= 2) { // If the value is too high then it looks like the ball reflects from air


				var ptA = pt.getPositionWorldOnA();
				var ptB = pt.getPositionWorldOnB();
				// console.log("i________________ :" + i);
				// console.log("ptA.getZ() :" + ptA.getZ());
				// console.log("ptB.getZ() :" + ptB.getZ());

				var lpA = pt.get_m_localPointA();
				var lpB = pt.get_m_localPointB();
				var hitsEnd = false;
				if (lpB.getX() >= 49.999 || lpB.getX() <= -49.999) {
					hitsEnd = true;
				}
				var mind0 = pt.get_m_index0();
				var mind1 = pt.get_m_index1();
				// var normalOnA = pt.get_m_normalWorldOnA();
				var normalOnB = pt.get_m_normalWorldOnB();
				// console.log("lpA " + lpA.getX() + " " + lpA.getZ());
				// console.log("lpB " + lpB.getX() + " " + lpB.getZ());
				// console.log("mind0 " + mind0);
				// console.log("mind1 " + mind1);
				// console.log("normalOnB " + normalOnB.getX() + " " + normalOnB.getZ());

				var rbA = Ammo.wrapPointer(obA, Ammo.btRigidBody);
				var rbB = Ammo.wrapPointer(obB, Ammo.btCollisionObject);

				if (rbA.mesh !== null && rbB.mesh !== null) {
					// console.log("rbA " + rbA.mesh.name);
					// console.log("rbB " + rbB.mesh.name);
					if (rbA.mesh.name === "ball" && rbB.mesh.type === "box") {
						// console.log("ball collides a border 1");

						// rbB is a border
						this.ball.onCollision(rbB.mesh, ptB, hitsEnd);
					} else if (rbB.mesh.name === "ball" && rbA.mesh.type === "box") {
						// console.log("ball collides a border 2");

						// rbA is a border
						this.ball.onCollision(rbA.mesh, ptB, hitsEnd);
					}
				}
			}
		}
	}
	this.ball.update(collidableMeshList, delta);
}

SceneGenerator.prototype.updateScene = function() {
	if (sceneGen.playerAmount !== sceneGen.oldPlayerAmount) {
		generateScene();
	}
	// sceneGen.camera.up = new THREE.Vector3(0, 1, 0); // What is this?
}