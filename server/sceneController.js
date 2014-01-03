var zeroVec = new float3(0, 0, 0);
var pi = 3.14159265359;


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
var t = cam.placeable.transform;
t.pos.x = 0;
t.pos.y = 300;
t.pos.z = 0;
t.rot.x = -90;
cam.placeable.transform = t;

// PLAYERS
var playerAmount = 3;
var clientPlayerAmount = 0;
var oldPlayerAmount = playerAmount;
var playerAreas = scene.EntitiesWithComponent("EC_DynamicComponent", "PlayerArea");
for (var i = 0; i < playerAreas.length; i++) {
	console.LogInfo("player: " + playerAreas[i].player);
}
var playerAreaWidth = 100;

// BALL
var ball = scene.GetEntityByName("Sphere");
var ballSpeed = 80.0;
var ballt = ball.placeable.transform;
ballt.pos = zeroVec;
ballt.rot = zeroVec;
ball.placeable.transform = ballt;
ball.rigidbody.SetLinearVelocity(new float3(1, 0, 1));
ball.rigidbody.SetAngularVelocity(zeroVec);
// ball.rigidbody.SetLinearVelocity(zeroVec);
// trigger
ball.rigidbody.PhysicsCollision.connect(ball, handleBallCollision);

// PLAYER AREAS
var entities = [];
var partfile = "playerArea.txml";
generateScene();

function generateScene() {
	deleteScene();

	// TODO reset ball position

	// Angle in radians
	var radians = pi * 2 / this.playerAmount;

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

		radians = pi * 2 / this.playerAmount * (i + 1);
		var degree = 360 - (radians * (180 / pi));

		var x = Math.cos(radians) * radius * pivotPoint;
		var z = Math.sin(radians) * radius * pivotPoint;

		var t = areaParent.placeable.transform;
		t.pos.x = x;
		t.pos.z = z;
		t.rot.y = degree;
		areaParent.placeable.transform = t;

		// TODO this.playerAreas.push(pa);
	}
	// console.LogInfo("entities length: " + entities.length);
}

function deleteScene() {
	// console.LogInfo("entities length: " + entities.length);
	for (var i = 0; i < entities.length; i++) {
		scene.RemoveEntity(entities[i].id);
	}
}

function pathForAsset(assetref) {
	return asset.GetAsset(assetref).DiskSource();
}

function loadPart(partfile) {
	// console.LogInfo("load part");
	var ents = scene.LoadSceneXML(pathForAsset(partfile), false, false, 2); //, changetype);
	// entities.concat(entities,ents);

	for (var i = 0; i < ents.length; i++) {
		entities.push(ents[i]);
		// console.LogInfo(ents[i]);
	}

	// Set racket ref in parent entity
	var parentEntity = ents[0];

	var children = parentEntity.placeable.Children();
	// console.LogInfo(children[1].id);

	// var attrs = parentEntity.dynamiccomponent;
	// console.LogInfo(attrs.GetAttribute("racketRef"));
	// attrs.SetAttribute("racketRef", new EntityReference(ents[2].id));

	// Return parent
	return parentEntity;
}

function ServerHandleUserConnected(userConnection, responseData) {
	console.LogInfo("userConnection.id: " + userConnection.id);
	console.LogInfo("userConnection.LoginData(): " + userConnection.Property("name"));


	for (var i = 0; i < playerAreas.length; i++) {
		if (playerAreas[i].player === undefined) {
			var attrs = playerAreas[i].dynamiccomponent;
			console.LogInfo("set to: " + userConnection.Property("name"));
			playerAreas[i].player = userConnection.Property("name");
			attrs.SetAttribute("playerID", userConnection.Property("name"));
			break;
		} else {
			console.LogInfo("this playerArea had a player: " + playerAreas[i].player);
		}
	}
}

function ServerHandleUserDisconnected(userConnection) {
	console.LogInfo("user disconnected:");
	console.LogInfo("userConnection.id: " + userConnection.id);
	console.LogInfo("userConnection.LoginData(): " + userConnection.Property("name"));


	for (var i = 0; i < playerAreas.length; i++) {
		if (playerAreas[i].player === userConnection.Property("name")) {
			var attrs = playerAreas[i].dynamiccomponent;
			console.LogInfo("set to undefined");
			playerAreas[i].player = undefined;
			attrs.SetAttribute("playerID", undefined);
			break;
		} else {
			console.LogInfo("this playerArea had a player: " + playerAreas[i].player);
		}
	}
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