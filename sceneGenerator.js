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