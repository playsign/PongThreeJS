/*
	Three.js "tutorials by example"
	Author: Lee Stemkoski
	Date: July 2013 (three.js v59dev)
 */

// MAIN

// standard global variables
var container, scene, camera, renderer, controls, stats, gui;
var keyboard = new THREEx.KeyboardState();
var clock = new THREE.Clock();

var playerAmount = 2;
var oldPlayerAmount = 0;

var playerAreas = [];
var collidableMeshList = [];


// window.onload = function() {
// var gui = new dat.GUI();
// gui.add(this, 'playerAmount').min(3).max(100).step(1).listen();
// };

// custom global variables
var borderMaterial;
var mesh;

var ball;

init();
animate();

// FUNCTIONS 		

function init() {
	// SCENE
	scene = new THREE.Scene();
	// CAMERA
	var SCREEN_WIDTH = window.innerWidth,
		SCREEN_HEIGHT = window.innerHeight;
	var VIEW_ANGLE = 45,
		ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT,
		NEAR = 0.1,
		FAR = 20000;
	camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
	scene.add(camera);
	camera.position.set(0, 500, 0);
	camera.lookAt(scene.position);
	// DAT GUI
	container = document.getElementById('ThreeJS');
	gui = new dat.GUI();
	gui.add(this, 'playerAmount').min(2).max(100).step(1).listen();
	gui.open();
	gui.domElement.style.position = 'absolute';
	gui.domElement.style.right = '0px';
	// gui.domElement.style.zIndex = 100;
	container.appendChild(gui.domElement);
	// RENDERER
	if (Detector.webgl)
		renderer = new THREE.WebGLRenderer({
			antialias: true
		});
	else
		renderer = new THREE.CanvasRenderer();
	renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);

	container.appendChild(renderer.domElement);
	// EVENTS
	THREEx.WindowResize(renderer, camera);
	THREEx.FullScreen.bindKey({
		charCode: 'm'.charCodeAt(0)
	});
	// CONTROLS
	controls = new THREE.OrbitControls(camera, renderer.domElement);
	// STATS
	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.bottom = '0px';
	stats.domElement.style.zIndex = 100;
	container.appendChild(stats.domElement);

	// LIGHT
	var light = new THREE.PointLight(0xffffff);
	light.position.set(100, 250, 100);
	scene.add(light);
	// FLOOR
	var floorTexture = new THREE.ImageUtils.loadTexture('images/checkerboard.jpg');
	floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
	floorTexture.repeat.set(10, 10);
	var floorMaterial = new THREE.MeshBasicMaterial({
		map: floorTexture,
		side: THREE.DoubleSide
	});
	var floorGeometry = new THREE.PlaneGeometry(1000, 1000, 10, 10);
	var floor = new THREE.Mesh(floorGeometry, floorMaterial);
	floor.position.y = -0.5;
	floor.rotation.x = Math.PI / 2;
	scene.add(floor);
	// SKYBOX
	var skyBoxGeometry = new THREE.CubeGeometry(10000, 10000, 10000);
	var skyBoxMaterial = new THREE.MeshBasicMaterial({
		color: 0x9999ff,
		side: THREE.BackSide
	});
	var skyBox = new THREE.Mesh(skyBoxGeometry, skyBoxMaterial);
	scene.add(skyBox);

	////////////
	// CUSTOM //
	////////////


	var material = new THREE.MeshLambertMaterial({
		color: 0x009999
	});

	// var sphereGeometry = new THREE.SphereGeometry(5, 16, 16);

	// sphereMesh = new THREE.Mesh(sphereGeometry, material);
	// sphereMesh.position.set(0, 0, 0);
	// scene.add(sphereMesh);
	borderMaterial = new THREE.MeshLambertMaterial({
		color: 0x009999
	});

	ball = new Ball(borderMaterial);
	ball.update();

	scene.add(ball.sphereMesh);

	// var cubeGeometry = new THREE.CubeGeometry(100, 10, 10, 1, 1, 1);

	// cubeMesh = new THREE.Mesh(cubeGeometry, material);
	// cubeMesh.position.set(-100, 50, -50);
	// cubeMesh.rotation.y = 180 * (Math.PI / 180);

	// instantiateNewPlayerArea();

	generateScene();

	// console.log("cubeMesh.rotation.x: "+cubeMesh.rotation.x);
	// console.log("cubeMesh.rotation.y: "+cubeMesh.rotation.y);
	// console.log("cubeMesh.rotation.z: "+cubeMesh.rotation.z);

	// scene.add(cubeMesh);

	// gui = new dat.GUI();
	// gui.add(this, 'playerAmount').min(3).max(100).step(1).listen();
	// gui.open();

}

// function instantiateNewPlayerArea(position, rotation) {
// 	var pa = new PlayerArea.AreaObject(borderMaterial, position, rotation);

// 	scene.add(pa.group);

// 	// console.log("position: "+position.x+ " "+position.y+ " "+position.z);
// }

function generateScene() {
	playerAmount = Math.round(playerAmount);

	ball.sphereMesh.position = new THREE.Vector3(50, 0, 0);

	// Camera.main.orthographicSize =  Mathf.Pow(playerAmount + cameraTweak, 1.2);
	// ball.transform.position = Vector3.zero;

	// Destroy(playerAreaParent);
	// playerAreaParent = Instantiate(playerAreaParentPrefab, new Vector3(0, 0, 0),  Quaternion.identity);

	collidableMeshList = [];

	for (var i = 0; i < playerAreas.length; i++) {
		scene.remove(playerAreas[i]);
	}


	// Angle in radians
	var radians = Math.PI * 2 / playerAmount;

	var radius = playerAmount; // * radiusTweak;
	var pivotPoint = 10; // Push player area forward by width of the area

	// Calculate player are offset
	var tHypotenuse = radius;
	var tAngle = radians / 2;
	var tAdjacent = Math.cos(tAngle) * tHypotenuse;
	var playerAreaOffset = radius - tAdjacent;

	radius += radius - playerAreaOffset;



	for (var i = 0; i < playerAmount; i++) {
		radians = Math.PI * 2 / playerAmount * (i + 1);
		// var degree = 360 - (radians * (180 / Math.PI));

		var x = Math.cos(radians) * radius * pivotPoint;
		var z = Math.sin(radians) * radius * -1 * pivotPoint;

		// console.log("x : "+x );
		// console.log("z : "+z );
		// console.log("radius : "+radius);

		// instantiateNewPlayerArea(new THREE.Vector3(x , 0, z), radians);

		var pa = new playerArea(borderMaterial, new THREE.Vector3(x, 0, z), radians);
		playerAreas.push(pa.group);

		collidableMeshList.push(pa.borderBottom);
		collidableMeshList.push(pa.borderLeft);
		collidableMeshList.push(pa.borderTop);

		scene.add(pa.group);

	}
	oldPlayerAmount = playerAmount;
}


function animate() {
	requestAnimationFrame(animate);
	render();
	update();
}

function update() {
	// Refresh the scene if the player amount has changed
	if (playerAmount != oldPlayerAmount) {
		generateScene();
	}


	if (keyboard.pressed("z")) {
		// do something
	}

	controls.update();
	camera.up = new THREE.Vector3(0, 1, 0);
	stats.update();
	ball.update(collidableMeshList);
}

function render() {
	renderer.render(scene, camera);
}

// Rotate an object around an arbitrary axis in object space
var rotObjectMatrix;

function rotateAroundObjectAxis(object, axis, radians) {
	rotObjectMatrix = new THREE.Matrix4();
	rotObjectMatrix.makeRotationAxis(axis.normalize(), radians);
	object.matrix.multiplySelf(rotObjectMatrix); // post-multiply

	// new code for Three.js r50+
	object.rotation.setEulerFromRotationMatrix(object.matrix);

	// old code for Three.js r49 and earlier:
	// object.rotation.getRotationFromMatrix(object.matrix, object.scale);
}

var rotWorldMatrix;
// Rotate an object around an arbitrary axis in world space       

function rotateAroundWorldAxis(object, axis, radians) {
	rotWorldMatrix = new THREE.Matrix4();
	rotWorldMatrix.makeRotationAxis(axis.normalize(), radians);
	rotWorldMatrix.multiplySelf(object.matrix); // pre-multiply
	object.matrix = rotWorldMatrix;

	// new code for Three.js r50+ --
	object.rotation.setEulerFromRotationMatrix(object.matrix);

	// old code for Three.js r49 and earlier --
	// object.rotation.getRotationFromMatrix(object.matrix, object.scale);
}