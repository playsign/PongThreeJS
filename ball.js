"use strict";
/*
 *	@author Tapani Jamsa
 */

function Ball(sceneCtrl, material) {
	// Pointers to globals
	this.sceneCtrl = sceneCtrl;
	this.gameDirector = gameDirector;
	this.keyboard = keyboard;

	this.speed = 80;
	this.speedTweak = 100;
	this.radius = 5;

	this.sphereGeometry = new THREE.SphereGeometry(this.radius, 16, 16);
	// this.sphereGeometry = new THREE.CubeGeometry(10, 10, 10, 1, 1, 1);

	this.sphereMesh = new THREE.Mesh(this.sphereGeometry, material);
	this.sphereMesh.position.set(0, 0, 0);
	this.sphereMesh.name = "ball";
	this.sphereMesh.type = "ball";

	// Create sphere physics model
	var mass = 10 * 10 * 10;
	var localInertia = new Ammo.btVector3(0, 0, 0);
	var capsuleShape = new Ammo.btCapsuleShape(this.radius, 10);
	capsuleShape.calculateLocalInertia(mass, localInertia);

	// Rigidbody
	var startTransform = new Ammo.btTransform();
	startTransform.setIdentity();
	startTransform.setOrigin(new Ammo.btVector3(0, 0, 0));
	var motionState = new Ammo.btDefaultMotionState(startTransform);
	var rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, capsuleShape, localInertia);
	this.sphereAmmo = new Ammo.btRigidBody(rbInfo);
	this.sphereAmmo.mesh = this.sphereMesh;
	this.sphereAmmo.setAngularFactor(new Ammo.btVector3(0, 1, 0));
	this.sphereAmmo.setLinearFactor(new Ammo.btVector3(1, 0, 1));
	this.sphereAmmo.setRestitution(0.5);
	this.sphereAmmo.setFriction(0);
	this.sceneCtrl.btWorld.addRigidBody(this.sphereAmmo);
	this.collider = this.sphereAmmo;
	var btV3 = new Ammo.btVector3(1, 0, 1);
	this.collider.setLinearVelocity(btV3);
}

Ball.prototype.update = function(delta) // Define Method
{
	if (delta <= 0) {
		return;
	}

	//  Reset position if the ball is out of the scene
	if (this.sceneCtrl.playerAreas[0] !== undefined && this.sphereMesh.position.length() > (this.sceneCtrl.playerAreas[0].group.position.length() + 200)) {
		console.log(" reset ");
		// ammo.js . Reset positions
		var transform = this.collider.getCenterOfMassTransform();
		transform.setOrigin(new Ammo.btVector3(0, 0, 0));
		this.collider.setCenterOfMassTransform(transform);
	}

	// Debug ball controls
	if (this.keyboard.pressed("u")) {
		var btV3 = new Ammo.btVector3(0, 0, 1);
		this.collider.setLinearVelocity(btV3);
	} else if (this.keyboard.pressed("j")) {
		var btV3 = new Ammo.btVector3(0, 0, -1);
		this.collider.setLinearVelocity(btV3);
	} else if (this.keyboard.pressed("h")) {
		var btV3 = new Ammo.btVector3(1, 0, 0);
		this.collider.setLinearVelocity(btV3);
	} else if (this.keyboard.pressed("k")) {
		var btV3 = new Ammo.btVector3(-1, 0, 0);
		this.collider.setLinearVelocity(btV3);
	}

	// keep the speed of 1 (* delta)
	var btVelo = this.collider.getLinearVelocity();
	btVelo = btVelo.normalized();
	var btV3 = new Ammo.btVector3(btVelo.getX() * this.speed * this.speedTweak * delta, 0, btVelo.getZ() * this.speed * this.speedTweak * delta);
	this.collider.setLinearVelocity(btV3);

	var transform = new Ammo.btTransform();
	this.collider.getMotionState().getWorldTransform(transform);
	var origin = transform.getOrigin();

	// set mesh position to transform origin
	this.sphereMesh.position.x = origin.x();
	this.sphereMesh.position.y = origin.y();
	this.sphereMesh.position.z = origin.z();

	// set mesh rotation
	var btQuat = transform.getRotation();
	var threeQuat = new THREE.Quaternion(btQuat.x(), btQuat.y(), btQuat.z(), btQuat.w());

	this.sphereMesh.rotation.setFromQuaternion(threeQuat);
};

Ball.prototype.onCollision = function(border, collisionPoint) {
	// Left border
	if (border.name == "left") {
		// console.log("left border");
		border.parentNode.playerBalls--;
		refreshPlayersInfo();

		// ammo.js . Reset positions
		var transform = this.collider.getCenterOfMassTransform();
		transform.setOrigin(new Ammo.btVector3(0, 0, 0));
		this.collider.setCenterOfMassTransform(transform);

		var direction = new THREE.Vector3(0, 0, 0);
		direction.getPositionFromMatrix(border.matrixWorld);

		direction.normalize();

		var newVelocity = direction;

		// Three.js vector3 to Ammo.js vector3
		var btV3 = new Ammo.btVector3(newVelocity.x, newVelocity.y, newVelocity.z);
		this.collider.setLinearVelocity(btV3);
		this.collider.setAngularVelocity(new Ammo.btVector3(0,0,0));
	}
};