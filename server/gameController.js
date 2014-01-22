// For conditions of distribution and use, see copyright notice in LICENSE
/*
 *	GameController
 *	@author Tapani Jamsa
 *	Date: 2013
 */

var zeroVec = new float3(0, 0, 0);

if (server.IsRunning()) {
	server.UserConnected.connect(ServerHandleUserConnected);
	server.UserDisconnected.connect(ServerHandleUserDisconnected);

	// If there are connected users when this script was added, add av for all of them
	var users = server.AuthenticatedUsers();
	if (users.length > 0)
		console.LogInfo("[Pong Application] Application started.");

	for (var i = 0; i < users.length; i++) {
		ServerHandleUserConnected(users[i].id, users[i]);
	}
}

// CAMERA
var cam = scene.GetEntityByName("FreeLookCamera");
cam.farPlane = 50000;
var camPosModifier = 110;
var minCameraPosY = 300;
var camPos = cam.placeable.transform;
camPos.pos.x = 0;
camPos.pos.y = minCameraPosY;
camPos.pos.z = 0;
camPos.rot.x = -90;
cam.placeable.transform = camPos;

// PLAYERS
var playerAmount = 0;
var spectatorAmount = 0;
var players = [];

// BALL
var ball = scene.GetEntityByName("Sphere");
var ballSpeed = 80.0;
var ballSpeedModifier = 50.0;
resetBall();
// trigger
ball.rigidbody.PhysicsCollision.connect(ball, handleBallCollision);

// PLAYER AREAS
var gameController = scene.GetEntityByName("GameController");
var playerAreas = [];
var entities = [];
var partfile = "playerArea.txml";

// OTHER
var initialBallCount = 5; // how many times a player may let ball in?

function generateScene() {
	console.LogInfo("generate scene");
	console.LogInfo("player amount: " + playerAmount);

	// First we need to delete old scene if available
	deleteScene();

	// Reset ball position to center
	resetBall();

	// More players, faster ball
	ballSpeed = ballSpeedModifier * playerAmount;

	// Angle in radians
	var radians = Math.PI * 2 / playerAmount;

	var radius = playerAmount;
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

	// Create player areas
	for (var i = 0; i < playerAmount; i++) {
		var areaParent = loadPart(partfile);

		radians = Math.PI * 2 / playerAmount * (i + 1);
		var degree = 360 - (radians * (180 / Math.PI));

		var x = Math.cos(radians) * radius * pivotPoint;
		var z = Math.sin(radians) * radius * pivotPoint;

		var t = areaParent.placeable.transform;
		t.pos.x = x;
		t.pos.z = z;
		t.rot.y = degree;
		areaParent.placeable.transform = t;

		var attrs = areaParent.dynamiccomponent;
		attrs.SetAttribute("playerID", players[i]);

		// Color
		attrs.SetAttribute("color", getRandomColor());

		// Balls 
		attrs.SetAttribute("playerBalls", initialBallCount);
	}

	// List of player areas
	playerAreas = scene.EntitiesWithComponent("EC_DynamicComponent", "PlayerArea");

	// Set the player area list to scene controller's dynamic component
	var attrs = gameController.dynamiccomponent;
	var playerAreaList = attrs.GetAttribute("playerAreas");

	for (var i = 0; i < playerAreas.length; i++) {
		playerAreaList.push(playerAreas[i].id);
	}
	attrs.SetAttribute("playerAreas", playerAreaList);

	// Camera position
	camPos.pos.y = Math.max(playerAmount * camPosModifier, minCameraPosY);
	cam.placeable.transform = camPos;

	// Notify clients that the scene is now genereted
	gameController.Exec(4, "sceneGenerated", "sceneGenerated", this.playerAmount);
}

function getRandomColor() {
	return '#' + '000000'.concat(Math.floor(Math.random() * 16777215).toString(16)).substr(-6);
}

// Delete the current scene but leave the scene controller and the ball

function deleteScene() {
	// Reset the player areas list
	var attrs = gameController.dynamiccomponent;
	attrs.SetAttribute("playerAreas", []);

	for (var i = 0; i < entities.length; i++) {
		scene.RemoveEntity(entities[i].id);
	}

	entities = [];
}

// Reset the position of the ball

function resetBall() {
	var ballt = ball.placeable.transform;
	ballt.pos = zeroVec;
	ballt.rot = zeroVec;
	ball.placeable.transform = ballt;
	ball.rigidbody.SetLinearVelocity(new float3(1, 0, 0.88));
	ball.rigidbody.SetAngularVelocity(zeroVec);
}

// Path to the scene txml (playerArea.txml)

function pathForAsset(assetref) {
	return asset.GetAsset(assetref).DiskSource();
}

// Load the scene txml (playerArea.txml)

function loadPart(partfile) {
	var ents = scene.LoadSceneXML(pathForAsset(partfile), false, false, 2); //, changetype);

	for (var i = 0; i < ents.length; i++) {
		entities.push(ents[i]);
	}

	// Set the racket ref in the parent entity
	var parentEntity = ents[0];

	var children = parentEntity.placeable.Children();

	var attrs = parentEntity.dynamiccomponent;
	attrs.SetAttribute("racketRef", children[1].id);
	attrs.SetAttribute("borderLeftRef", children[2].id);

	return parentEntity;
}

// Player connected

function ServerHandleUserConnected(userID, userConnection) {
	console.LogInfo("user name: " + userConnection.Property("name"));
	console.LogInfo("player amount: " + playerAmount);

	players.push(userConnection.Property("name"));

	playerAmount++;

	generateScene();

	// Set player's name(id) to player area's dynamic component
	var pa = playerAreas[playerAreas.length - 1];
	var attrs = pa.dynamiccomponent;
	pa.player = userConnection.Property("name");
	attrs.SetAttribute("playerID", userConnection.Property("name"));
}

// Player disconnected

function ServerHandleUserDisconnected(userID, userConnection) {
	console.LogInfo("user disconnected:");
	// console.LogInfo("userConnection.id: " + userConnection.id);
	console.LogInfo("user name: " + userConnection.Property("name"));

	if (spectatorAmount === 0) {
		playerAmount--;
	} else {
		spectatorAmount--;
	}

	for (var i = 0; i < players.length; i++) {
		if (players[i] === userConnection.Property("name")) {
			players.splice(i, 1);
		}
	}

	generateScene();
}

function handleBallCollision(ent, pos, normal, distance, impulse, newCollision) {
	// console.LogInfo(ent.name);
	if (ent.name == "borderLeft") {
		var ballt = ball.placeable.transform;
		ballt.pos = zeroVec;
		ballt.rot = zeroVec;
		ball.placeable.transform = ballt;

		// console.LogInfo(ent.placeable.parentRef.ref);
		var parent = scene.EntityById(ent.placeable.parentRef.ref);
		var attrs = parent.dynamiccomponent;
		attrs.SetAttribute("playerBalls", attrs.GetAttribute("playerBalls") - 1);

		if (attrs.GetAttribute("playerBalls") <= 0) {
			console.LogInfo("a player is out of balls");

			// Remove the player but don't disconnect

			var playerID = attrs.GetAttribute("playerID");

			playerAmount--;
			spectatorAmount++;
			for (var i = 0; i < players.length; i++) {
				if (players[i] === playerID) {
					players.splice(i, 1);

					// Notify clients about the player game over
					gameController.Exec(4, "gameover", "gameover", playerID, playerAmount + 1); //(1)
				}
			}

			generateScene();
		}
	}
}

function update(dt) {
	var rigidbody = ball.rigidbody;
	var velvec = rigidbody.GetLinearVelocity();
	var curdir = velvec.Normalized();
	velvec = curdir.Mul(ballSpeed);
	rigidbody.SetLinearVelocity(velvec);
}

frame.Updated.connect(update);
