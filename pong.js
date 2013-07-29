/*
	Pong
	Author: Playsign
	Date: 2013
 */

// MAIN

// standard global variables
var container, scene, camera, renderer, controls, stats, gui;
var keyboard = new THREEx.KeyboardState();
var clock = new THREE.Clock();

var cameraTweak = 0.1;

var playerAmount = 6;
var oldPlayerAmount = playerAmount;

var playerAreas = [];
var collidableMeshList = [];

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
	// camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
	camera = new THREE.OrthographicCamera(-SCREEN_WIDTH / 2, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, -SCREEN_HEIGHT / 2, NEAR, FAR);
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
	// var light = new THREE.AmbientLight(0x999999); // soft white light
	// scene.add(light);

	var light = new THREE.PointLight(0xffffff);
	light.position.set(-300, 300, -300);
	scene.add(light);

	// White directional light at half intensity shining from the top.
	var light = new THREE.DirectionalLight(0xffffff, 1);
	light.position.set(300, 300, 300);
	scene.add(light);


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
	// scene.add(floor);
	// SKYBOX
	var skyBoxGeometry = new THREE.CubeGeometry(10000, 10000, 10000);
	var skyBoxMaterial = new THREE.MeshBasicMaterial({
		color: 0x000000,
		side: THREE.BackSide
	});
	var skyBox = new THREE.Mesh(skyBoxGeometry, skyBoxMaterial);
	scene.add(skyBox);

	////////////
	// CUSTOM //
	////////////


	var material = new THREE.MeshLambertMaterial({
		color: 0x999999
	});

	borderMaterial = new THREE.MeshLambertMaterial({
		color: 0x999999
	});



	ball = new Ball(borderMaterial);
	gui.add(ball, 'speed').min(0).max(100).step(0.1).listen();

	// generateScene();

	gameDirector = new director();
}

function deleteScene() {
	scene.remove(ball.sphereMesh);

	collidableMeshList = [];

	for (var i = 0; i < playerAreas.length; i++) {
		scene.remove(playerAreas[i].group);
	}

	playerAreas = [];
}

function generateScene() {
	// delete previous scene
	deleteScene();

	// Ball
	scene.add(ball.sphereMesh);

	playerAmount = Math.round(playerAmount);

	ball.sphereMesh.position = new THREE.Vector3(50, 0, 0);
	ball.lastCollider = null;



	// Camera.main.orthographicSize =  Mathf.Pow(playerAmount + cameraTweak, 1.2);
	// update the camera
	var camFactor = Math.pow(playerAmount, 0.7) * cameraTweak;
	camera.left = -window.innerWidth * camFactor;
	camera.right = window.innerWidth * camFactor;
	camera.top = window.innerHeight * camFactor;
	camera.bottom = -window.innerHeight * camFactor;
	camera.updateProjectionMatrix();



	// Angle in radians
	var radians = Math.PI * 2 / playerAmount;

	var radius = playerAmount; // * radiusTweak;
	var pivotPoint = 9; // Push player area forward by width of the area

	// Two player tweak to remove gaps between player areas
	if (playerAmount == 2) {
		pivotPoint -= 4;
	}

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

		var randomColor = '#'+Math.floor(Math.random()*16777215).toString(16);
		// var newMaterial = new THREE.MeshLambertMaterial({
			// color: randomColor
		// });

		var pa = new playerArea(new THREE.Vector3(x, 0, z), radians, randomColor, i);

		playerAreas.push(pa);

		collidableMeshList.push(pa.borderBottom);
		collidableMeshList.push(pa.borderLeft);
		collidableMeshList.push(pa.borderTop);
		collidableMeshList.push(pa.racketMesh);

		scene.add(pa.group);

	}

	// Players info
	refreshPlayersInfo();


	oldPlayerAmount = playerAmount;
}

function refreshPlayersInfo() {
	$("#playersInfo").empty();
	for (var i = 0; i < playerAmount; i++) {

		$("#playersInfo").append("<font color = "+playerAreas[i].playerColor+">Player" + (i + 1) +"</font>");
		switch (playerAreas[i].playerBalls) {
			case 0:
				$("#playersInfo").append("<img width='¨12' height='12' src='images/ballIconRed.png'/> ");
				$("#playersInfo").append("<img width='12' height='12' src='images/ballIconRed.png'/> ");
				$("#playersInfo").append("<img width='12' height='12' src='images/ballIconRed.png'/> <br>");
				break;
			case 1:
				$("#playersInfo").append("<img width='¨12' height='12' src='images/ballIcon.png'/> ");
				$("#playersInfo").append("<img width='12' height='12' src='images/ballIconRed.png'/> ");
				$("#playersInfo").append("<img width='12' height='12' src='images/ballIconRed.png'/> <br>");
				break;
			case 2:
				$("#playersInfo").append("<img width='¨12' height='12' src='images/ballIcon.png'/> ");
				$("#playersInfo").append("<img width='12' height='12' src='images/ballIcon.png'/> ");
				$("#playersInfo").append("<img width='12' height='12' src='images/ballIconRed.png'/> <br>");
				break;
			case 3:
				$("#playersInfo").append("<img width='¨12' height='12' src='images/ballIcon.png'/> ");
				$("#playersInfo").append("<img width='12' height='12' src='images/ballIcon.png'/> ");
				$("#playersInfo").append("<img width='12' height='12' src='images/ballIcon.png'/> <br>");
				break;
		}
	}
}

function animate() {
	requestAnimationFrame(animate);
	render();
	update();
}

function update() {
	// Refresh the scene if the player amount has changed
	var delta = clock.getDelta(); // seconds.

	if (playerAmount != oldPlayerAmount) {
		generateScene();
	}

	controls.update();
	camera.up = new THREE.Vector3(0, 1, 0);
	stats.update();
	ball.update(collidableMeshList, delta);
	for (var i = 0; i < playerAreas.length; i++) {
		playerAreas[i].update(collidableMeshList, delta);
	}

}

function render() {
	renderer.render(scene, camera);
}