/* -*- js-indent-level: 8 -*-

	Pong
	Author: Playsign
	Date: 2013
 */

// MAIN

// standard global variables
var container, scene, camera, renderer, controls, stats, gui;
var SCREEN_WIDTH, SCREEN_HEIGHT, VIEW_ANGLE, ASPECT, NEAR, FAR;
var keyboard = new THREEx.KeyboardState();
var clock = new THREE.Clock();

var cameraTweak = 0.1;

var playerAmount = 3;
var oldPlayerAmount = playerAmount;

var playerAreas = [];
var players = [];
var collidableMeshList = [];

var playerAreaWidth = 100; // TODO duplicated in playerArea

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

	// AMMO.JS
	collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
	dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
	overlappingPairCache = new Ammo.btDbvtBroadphase();
	solver = new Ammo.btSequentialImpulseConstraintSolver();
	scene.world = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
	scene.world.setGravity(new Ammo.btVector3(0, 0, 0));

	// CAMERA
	SCREEN_WIDTH = window.innerWidth,
	SCREEN_HEIGHT = window.innerHeight;
	VIEW_ANGLE = 45,
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
	gui.close();
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
	controls.userZoom = false;

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
	gui.add(ball, 'speed').min(0.1).max(400).step(0.1).listen();
	scene.add(ball.sphereMesh);

	// generate scene in menu?
	// generateScene();

	gameDirector = new director();
	//initNet(clientUpdate);
}

function deleteScene() {
	collidableMeshList = [];

	for (var i = 0; i < playerAreas.length; i++) {
		// ammo.js
		scene.world.removeRigidBody(playerAreas[i].borderBottom.collider);
		scene.world.removeRigidBody(playerAreas[i].borderLeft.collider);
		scene.world.removeRigidBody(playerAreas[i].borderTop.collider);
		scene.world.removeRigidBody(playerAreas[i].racketMesh.collider);

		scene.remove(playerAreas[i].group);
	}

	playerAreas = [];
}

function generateScene() {
	// delete previous scene
	deleteScene();

	playerAmount = Math.round(playerAmount);

	ball.lastCollider = null;

	// ammo.js . Reset positions
	transform = ball.collider.getCenterOfMassTransform();
	transform.setOrigin(new Ammo.btVector3(0, 0, 0));
	ball.collider.setCenterOfMassTransform(transform);

	// Angle in radians
	var radians = Math.PI * 2 / playerAmount;

	var radius = playerAmount; // * radiusTweak;
	var pivotPoint = 9; // 10 Push player area forward by width of the area

	// Two player tweak to remove gaps between player areas
	if (playerAmount == 2) {
		pivotPoint -= 5; // 4.5 , 5,5
	} else if (playerAmount == 3) {
		pivotPoint -= 0.5; //-0,5
	}

	// Calculate player area offset
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

		var pa = new playerArea(new THREE.Vector3(x, 0, z), radians, i);

		playerAreas.push(pa);

		collidableMeshList.push(pa.borderBottom);
		collidableMeshList.push(pa.borderLeft);
		collidableMeshList.push(pa.borderTop);
		collidableMeshList.push(pa.racketMesh);

		scene.add(pa.group);
	}

	// update the camera
	var gameAreaDiameter = (radius * 25 + (playerAreaWidth * 2)); // TODO 25 the magic number
	console.log("gameAreaDiameter: " + gameAreaDiameter);
	if (SCREEN_HEIGHT < SCREEN_WIDTH) {
		camera.left = ASPECT * -gameAreaDiameter / 2;
		camera.right = ASPECT * gameAreaDiameter / 2;
		camera.top = gameAreaDiameter / 2;
		camera.bottom = -gameAreaDiameter / 2;
	} else {
		camera.left = -gameAreaDiameter / 2;
		camera.right = gameAreaDiameter / 2;
		camera.top =  gameAreaDiameter / 2 / ASPECT;
		camera.bottom =  -gameAreaDiameter / 2 / ASPECT;
	}

	camera.updateProjectionMatrix();

	// Players info
	refreshPlayersInfo();

	oldPlayerAmount = playerAmount;
}

function refreshPlayersInfo() {
	$("#playersInfo").empty();
	for (var i = 0; i < playerAmount; i++) {

		$("#playersInfo").append("<font color = " + playerAreas[i].player.color + ">Player" + (i + 1) + "</font>");
		switch (playerAreas[i].player.balls) {
			case 0:
				$("#playersInfo").append("<img width='Â¨12' height='12' src='images/ballIconRed.png'/> ");
				$("#playersInfo").append("<img width='12' height='12' src='images/ballIconRed.png'/> ");
				$("#playersInfo").append("<img width='12' height='12' src='images/ballIconRed.png'/> <br>");
				break;
			case 1:
				$("#playersInfo").append("<img width='Â¨12' height='12' src='images/ballIcon.png'/> ");
				$("#playersInfo").append("<img width='12' height='12' src='images/ballIconRed.png'/> ");
				$("#playersInfo").append("<img width='12' height='12' src='images/ballIconRed.png'/> <br>");
				break;
			case 2:
				$("#playersInfo").append("<img width='Â¨12' height='12' src='images/ballIcon.png'/> ");
				$("#playersInfo").append("<img width='12' height='12' src='images/ballIcon.png'/> ");
				$("#playersInfo").append("<img width='12' height='12' src='images/ballIconRed.png'/> <br>");
				break;
			case 3:
				$("#playersInfo").append("<img width='Â¨12' height='12' src='images/ballIcon.png'/> ");
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

    if (netRole == 'client')
        return;

    // online game mode
	if (netRole != null){
		var racketPositions = [];
		for (var i = 0; i < playerAreas.length; i++) {
		        playerAreas[i].serverUpdate(delta, clientKeysPressed ? clientKeysPressed : [], clientID, i);
	                racketPositions.push(playerAreas[i].racketMesh.position);
		}
	} else {
		// offline game mode
		for (var i = 0; i < playerAreas.length; i++) {
			playerAreas[i].offlineUpdate(collidableMeshList, delta);
		}
	}

	// ammo.js step simulation
	var timeStep = 1 / 60; // time passed after last simulation. if timeStep is 0.1 then it will include 6 (timeStep / fixedTimeStep) internal simulations. It's important that timeStep is always less than maxSubSteps*fixedTimeStep, otherwise you are losing time
	var maxSubSteps = 20; // 5
	var fixedTimeStep = 1 / 240; // Internally simulation is done for some internal constant steps. fixedTimeStep ~~~ 0.01666666 = 1/60. If you are finding that your objects are moving very fast and escaping from your walls instead of colliding with them, then one way to help fix this problem is by decreasing fixedTimeStep. If you do this, then you will need to increase maxSubSteps to ensure the equation listed above is still satisfied. Say you want twice the resolution, you'll need twice the maxSubSteps,
	scene.world.stepSimulation(timeStep, maxSubSteps, fixedTimeStep);

	// ammo.js check collisions
	var numManifolds = scene.world.getDispatcher().getNumManifolds();
	// if(numManifolds > 0){
	// 	console.log("numManifolds: "+numManifolds);
	// }

	for (var i = 0; i < numManifolds; i++) {
		var contactManifold = scene.world.getDispatcher().getManifoldByIndexInternal(i);
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

				if (rbA.mesh != null && rbB.mesh != null) {
					// console.log("rbA " + rbA.mesh.name);
					// console.log("rbB " + rbB.mesh.name);
					if (rbA.mesh.name == "ball" && rbB.mesh.type == "box") {
						// console.log("ball collides a border 1");

						// rbB is a border
						ball.onCollision(rbB.mesh, ptB, hitsEnd);
					} else if (rbB.mesh.name == "ball" && rbA.mesh.type == "box") {
						// console.log("ball collides a border 2");

						// rbA is a border
						ball.onCollision(rbA.mesh, ptB, hitsEnd);
					}
				}
			}
		}
	}

	ball.update(collidableMeshList, delta);

	// online game mode
	if (netRole != null){
    	serverNetUpdate(racketPositions, ball.sphereMesh.position, delta, playerAmount, players);
    }
}

function render() {
	renderer.render(scene, camera);
}

function showHelp(){
	gameDirector.setScreen(screens.controls);
}

function getRandomColor(){
	return '#' + '000000'.concat(Math.floor(Math.random() * 16777215).toString(16)).substr(-6);
}

function clientUpdate(msg) {
        // called in client mode (when we're just showing what server tells us).
        if (msg.dt === undefined || msg.ballpos === undefined || msg.racketspos === undefined)
                throw "update msg: missing properties";
        ball.sphereMesh.position = msg.ballpos;
	// ball.update(collidableMeshList, msg.dt);
        for (var i = 0; i < playerAreas.length; i++)
                playerAreas[i].clientUpdate(msg);
        return readKeyboard();
}

function readKeyboard() {        
        var pressed = [];
        function checkPressed(keyname) {
                if (keyboard.pressed(keyname))
                        pressed.push(keyname);
        }

        checkPressed("left");
        checkPressed("right");
        checkPressed("a");
        checkPressed("d");
        checkPressed("o");
        checkPressed("p");

        return pressed;
 }
