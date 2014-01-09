var zeroVec = new float3(0, 0, 0);

console.LogInfo(server);
if (server.IsRunning()) {
	console.LogInfo("server is running");
	websocketserver.UserConnected.connect(ServerHandleUserConnected);
	websocketserver.UserDisconnected.connect(ServerHandleUserDisconnected);
	//console.LogInfo("websocketserver.ConnectionId()"+websocketserver.ConnectionId());

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
var players = [];
// var clientPlayerAmount = 0;
// var oldPlayerAmount = playerAmount;
// var playerAreaWidth = 100;

// BALL
var ball = scene.GetEntityByName("Sphere");
var ballSpeed = 80.0;
var ballSpeedModifier = 50.0;
resetBall();
// ball.rigidbody.SetLinearVelocity(zeroVec);
// trigger
ball.rigidbody.PhysicsCollision.connect(ball, handleBallCollision);

// PLAYER AREAS
var sceneController = scene.GetEntityByName("SceneController");
var playerAreas = [];
var entities = [];
var partfile = "playerArea.txml";
// generateScene();

function generateScene() {
	console.LogInfo("generate scene");

	deleteScene();

	ballSpeed = ballSpeedModifier * playerAmount;

	resetBall();

	// Angle in radians
	var radians = Math.PI * 2 / this.playerAmount;

	var radius = this.playerAmount;
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

	for (var i = 0; i < playerAmount; i++) {
		var areaParent = loadPart(partfile);

		radians = Math.PI * 2 / this.playerAmount * (i + 1);
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

	}

	playerAreas = scene.EntitiesWithComponent("EC_DynamicComponent", "PlayerArea");

	var attrs = sceneController.dynamiccomponent;
	var playerAreaList = attrs.GetAttribute("playerAreas");

	for (var i = 0; i < playerAreas.length; i++) {
		playerAreaList.push(playerAreas[i].id);
		// attrs
	}
	attrs.SetAttribute("playerAreas", playerAreaList);

	// playerAreaList = attrs.GetAttribute("playerAreas");
	// console.LogInfo("playerAreaList[0]: " + playerAreaList[0]);

	// console.LogInfo("entities length: " + entities.length);

	// Camera position
	camPos.pos.y = Math.max(playerAmount * camPosModifier, minCameraPosY);
	cam.placeable.transform = camPos;

	sceneController.Exec(4, "sceneGenerated", "sceneGenerated", this.playerAmount);
}

function deleteScene() {
	// console.LogInfo("entities length: " + entities.length);
	// Clear playerAreas list
	var attrs = sceneController.dynamiccomponent;
	attrs.SetAttribute("playerAreas", []);

	for (var i = 0; i < entities.length; i++) {
		scene.RemoveEntity(entities[i].id);
	}

	entities = [];
}

function resetBall() {
	var ballt = ball.placeable.transform;
	ballt.pos = zeroVec;
	ballt.rot = zeroVec;
	ball.placeable.transform = ballt;
	ball.rigidbody.SetLinearVelocity(new float3(1, 0, 0.88));
	ball.rigidbody.SetAngularVelocity(zeroVec);
}

function pathForAsset(assetref) {
	return asset.GetAsset(assetref).DiskSource();
}

function loadPart(partfile) {
	console.LogInfo("load part");
	var ents = scene.LoadSceneXML(pathForAsset(partfile), false, false, 2); //, changetype);
	// entities.concat(entities,ents);

	console.LogInfo("ents:");
	for (var i = 0; i < ents.length; i++) {
		entities.push(ents[i]);
		// console.LogInfo(ents[i]);
	}

	// Set racket ref in parent entity
	var parentEntity = ents[0];

	var children = parentEntity.placeable.Children();

	var attrs = parentEntity.dynamiccomponent;
	attrs.SetAttribute("racketRef", children[1].id);

	// Return parent
	return parentEntity;
}

function ServerHandleUserConnected(userConnection, responseData) {
	console.LogInfo("userConnection.id: " + userConnection.id);
	console.LogInfo("userConnection.LoginData(): " + userConnection.Property("name"));

	players.push(userConnection.Property("name"));

	// for (var i = 0; i < playerAreas.length; i++) {
	// 	if (playerAreas[i].player === undefined) {
	playerAmount++;

	generateScene();

	var pa = playerAreas[playerAreas.length - 1];
	var attrs = pa.dynamiccomponent;
	pa.player = userConnection.Property("name");
	attrs.SetAttribute("playerID", userConnection.Property("name"));

	// break;
	// 	} else {
	// 		console.LogInfo("this playerArea had a player: " + playerAreas[i].player);
	// 	}
	// }
}

function ServerHandleUserDisconnected(userConnection) {
	console.LogInfo("user disconnected:");
	console.LogInfo("userConnection.id: " + userConnection.id);
	console.LogInfo("userConnection.LoginData(): " + userConnection.Property("name"));


	// for (var i = 0; i < playerAreas.length; i++) {
	// 	if (playerAreas[i].player === userConnection.Property("name")) {
			playerAmount--;
			for (var i = 0; i < players.length; i++) {
				console.LogInfo("players"+i);
					console.LogInfo(players[i]);
				if (players[i] === userConnection.Property("name")) {
					var spliced = players.splice(i, 1);
					console.LogInfo("spliced: ");
					console.LogInfo(spliced);
					console.LogInfo(i);
				}
			}

			// var attrs = playerAreas[i].dynamiccomponent;
			// console.LogInfo("set to undefined");
			// playerAreas[i].player = undefined;
			// attrs.SetAttribute("playerID", undefined);

			generateScene();

	// 		break;
	// 	} else {
	// 		console.LogInfo("this playerArea had a player: " + playerAreas[i].player);
	// 	}
	// }
}

function handleBallCollision(ent, pos, normal, distance, impulse, newCollision) {
	// console.LogInfo(ent.name);
	if (ent.name == "borderLeft ") {
		ball.placeable.transform = ballt;

		// console.LogInfo(ent.placeable.parentRef.ref);
		var parent = scene.EntityById(ent.placeable.parentRef.ref);
		// console.LogInfo(parent);
		var attrs = parent.dynamiccomponent;
		// console.LogInfo(attrs);
		attrs.SetAttribute("playerBalls", attrs.GetAttribute("playerBalls") - 1);
	}
}

function update(dt) {
	var rigidbody = ball.rigidbody;

	var velvec = rigidbody.GetLinearVelocity();
	var curdir = velvec.Normalized();
	//console.LogInfo(curdir);
	velvec = curdir.Mul(ballSpeed);
	rigidbody.SetLinearVelocity(velvec);
}

frame.Updated.connect(update);