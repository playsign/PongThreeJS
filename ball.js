"use strict";
/*
 * 	@author Tapani Jamsa
 */

function Ball(sceneCtrl, material) {
	// Pointers to globals
	this.sceneCtrl = sceneCtrl;
	this.gameDirector = gameDirector;
	this.keyboard = keyboard;

	this.speed = 80;
	this.radius = 5;

	this.sphereGeometry = new THREE.SphereGeometry(this.radius, 16, 16);

	this.sphereMesh = new THREE.Mesh(this.sphereGeometry, material);
	this.sphereMesh.position.set(0, 0, 0);
	this.sphereMesh.name = "ball";
	this.sphereMesh.type = "ball";

	// For fixing collision duplicate problems
	this.lastCollider = null;

	// Create sphere physics model
	var mass = 10 * 10 * 10;
	var localInertia = new Ammo.btVector3(0, 0, 0);
	var sphereShape = new Ammo.btSphereShape(this.radius);
	sphereShape.calculateLocalInertia(mass, localInertia);

	// Rigidbody
	var startTransform = new Ammo.btTransform();
	startTransform.setIdentity();
	startTransform.setOrigin(new Ammo.btVector3(0, 0, 0));
	var motionState = new Ammo.btDefaultMotionState(startTransform);
	var rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, sphereShape, localInertia);
	this.sphereAmmo = new Ammo.btRigidBody(rbInfo);
	this.sphereAmmo.mesh = this.sphereMesh;
	this.sphereAmmo.setLinearFactor(new Ammo.btVector3(1, 0, 1));
	this.sphereAmmo.setRestitution(1);
	this.sceneCtrl.btWorld.addRigidBody(this.sphereAmmo);
	this.collider = this.sphereAmmo;
	var btV3 = new Ammo.btVector3(1, 0, 1);
	this.collider.setLinearVelocity(btV3);

	// Glitch fix
	this.reversed = false;
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
		this.reversed = false;
		this.lastCollider = null;
	}

	// Debug ball controls
	if (this.keyboard.pressed("u")) {
		var btV3 = new Ammo.btVector3(0, 0, -1);
		this.collider.setLinearVelocity(btV3);
	} else if (this.keyboard.pressed("j")) {
		var btV3 = new Ammo.btVector3(0, 0, 1);
		this.collider.setLinearVelocity(btV3);
	} else if (this.keyboard.pressed("h")) {
		var btV3 = new Ammo.btVector3(-1, 0, 0);
		this.collider.setLinearVelocity(btV3);
	} else if (this.keyboard.pressed("k")) {
		var btV3 = new Ammo.btVector3(1, 0, 0);
		this.collider.setLinearVelocity(btV3);
	}

	// keep the speed of 1 (* delta)
	var btVelo = this.collider.getLinearVelocity();
	btVelo = btVelo.normalized();
	var tweak = 100; // TODO remove magic number
	var btV3 = new Ammo.btVector3(btVelo.getX() * this.speed * tweak * delta, 0, btVelo.getZ() * this.speed * tweak * delta);
	this.collider.setLinearVelocity(btV3);

	var transform = new Ammo.btTransform();
	this.collider.getMotionState().getWorldTransform(transform);
	var origin = transform.getOrigin();

	// set mesh position to transform origin
	this.sphereMesh.position.x = origin.x();
	this.sphereMesh.position.y = origin.y();
	this.sphereMesh.position.z = origin.z();
};

Ball.prototype.onCollision = function(border, collisionPoint, hitsEnd) {
	var distance = 9999;
	var threeCollisionPoint = new THREE.Vector3(collisionPoint.getX(), collisionPoint.getY(), collisionPoint.getZ());

	// Calculate distance between current collision point and previous collision point
	if (this.lastCollider !== null && this.lastCollider.ballPosition !== null && threeCollisionPoint !== null) {
		var distance = this.lastCollider.ballPosition.distanceTo(threeCollisionPoint);
	}

	//  Do collision logic if the ball is not colliding same object as previously
	if (this.lastCollider != border && distance > 10) {
		if (this.gameDirector.currentScreen === 0) {
			console.log("*ball bounce*");
		}

		this.lastCollider = border;

		// Border's direction
		var direction = new THREE.Vector3();
		direction.add(border.parent.rotation);
		direction.add(border.rotation);

		var borderNormal = new THREE.Vector3();
		var borderNormalRotated = new THREE.Vector3();

		// Angle to vector3
		borderNormal.x = Math.cos(direction.y * -1);
		borderNormal.z = Math.sin(direction.y * -1);
		direction = new THREE.Vector3(direction.x, direction.y + (90 * (Math.PI / 180)), direction.z);
		borderNormalRotated.x = Math.cos(direction.y * -1);
		borderNormalRotated.z = Math.sin(direction.y * -1);

		// Ammo.js vector3 to Three.js vector3
		var velo = this.collider.getLinearVelocity();
		var newVelocity = new THREE.Vector3(velo.getX(), velo.getY(), velo.getZ());

		var borderPos = new THREE.Vector3(0, 0, 0);
		borderPos = borderPos.getPositionFromMatrix(border.matrixWorld);
		var ballPos = new THREE.Vector3(collisionPoint.getX(), collisionPoint.getY(), collisionPoint.getZ());
		var toBall = ballPos.sub(borderPos);

		// // Determine if the ball is colliding from wrong side of the border (if not colliding left border or a racket)
		// if (border.name != "left" && border.name != "racket") {
		// 	// use dot product to determine if the ball is behind a border

		// 	var dotProduct = toBall.dot(borderNormalRotated);

		// 	if (dotProduct > -4.999) {
		// 		// if the ball is behind the border then reverse the velocity
		// 		if(this.reversed){
		// 			console.log("already reversed the velocity");
		// 			return;
		// 		}
		// 		console.log("tried to collide behind the border. reverse the velocity");
		// 		var velo = this.collider.getLinearVelocity();
		// 		velo = new Ammo.btVector3(velo.getX() * -1, velo.getY(), velo.getZ() * -1);
		// 		this.collider.setLinearVelocity(velo);
		// 		this.lastCollider.direction = velo;
		// 		this.lastCollider.ballPosition = new THREE.Vector3(threeCollisionPoint.x, threeCollisionPoint.y, threeCollisionPoint.z);
		// 		this.reversed = true;
		// 		return;
		// 	}
		// }

		if (hitsEnd) {
			var dotProduct = newVelocity.dot(borderNormalRotated);
			// console.log("newVelocity: " + newVelocity.x + " " + newVelocity.z);
			// console.log("borderNormal: " + borderNormal.x + " " + borderNormal.z);
			// console.log("dotProduct: " + dotProduct);
			if (dotProduct < 0) {
				borderNormal = borderNormalRotated;
				// console.log("rotated");
			}
		}

		//  Bottom border
		if (border.name == "bottom") {
			// console.log("bottom border");
			newVelocity.reflect(borderNormal);
		}
		// Left border
		else if (border.name == "left") {
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

			newVelocity = direction;
			this.lastCollider = null;
			this.reversed = false;
		}
		// Top border
		else if (border.name == "top") {
			// console.log("top border");

			newVelocity.reflect(borderNormal); //, border.forward);
		}
		// Racket
		else if (border.name == "racket") {
			//  left / middle / right ?
			var racketPos = new THREE.Vector3();

			racketPos.getPositionFromMatrix(border.matrixWorld);

			var difference = racketPos.sub(threeCollisionPoint);

			difference.normalize();
			difference.multiplyScalar(this.speed);

			newVelocity = difference;
			newVelocity.set(newVelocity.x * -1.0,
				newVelocity.y,
				newVelocity.z * -1.0);

			this.lastCollider = null;
		}

		// Three.js vector3 to Ammo.js vector3
		var btV3 = new Ammo.btVector3(newVelocity.x, newVelocity.y, newVelocity.z);
		this.collider.setLinearVelocity(btV3);

		if (this.lastCollider !== null) {
			this.lastCollider.direction = btV3;
			this.lastCollider.ballPosition = new THREE.Vector3(threeCollisionPoint.x, threeCollisionPoint.y, threeCollisionPoint.z);
		}
	}
};