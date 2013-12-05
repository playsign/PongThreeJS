var zeroVec = new float3(0, 0, 0);

// CAMERA
var cam = scene.GetEntityByName("FreeLookCamera");
var t = cam.placeable.transform;
t.pos.x = 0;
t.pos.y = 300;
t.pos.z = 0;
t.rot.x = -90;
cam.placeable.transform = t;

// PLAYERS
var playerAmount = 2;
var clientPlayerAmount = 0;
var oldPlayerAmount = playerAmount;
var playerAreas = [];
var playerAreaWidth = 100;

// For fixing collision duplicate problems
var lastCollider = null;

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

function update(dt) {
	var rigidbody = ball.rigidbody;

	var velvec = rigidbody.GetLinearVelocity();
	var curdir = velvec.Normalized();
	//console.LogInfo(curdir);
	velvec = curdir.Mul(ballSpeed);
	rigidbody.SetLinearVelocity(velvec);
}

frame.Updated.connect(update);