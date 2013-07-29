function Ball(material) {
	this.speed = 50;
	this.radius = 5;

	this.velocity = new THREE.Vector3(1, 0, 1);

	this.sphereGeometry = new THREE.SphereGeometry(this.radius, 16, 16);

	this.sphereMesh = new THREE.Mesh(this.sphereGeometry, material);
	this.sphereMesh.position.set(0, 0, 0);

	// For fixing collision problems
	this.lastCollider = null;

}

Ball.prototype.update = function(collidableMeshList, delta) // Define Method
{

	// keep the speed of 1
	this.velocity.normalize();

	var moveDistance = new THREE.Vector3(this.velocity.x * this.speed * delta, this.velocity.y * this.speed * delta, this.velocity.z * this.speed * delta);

	this.sphereMesh.position.add(moveDistance);

	// Collision detection:
	//   determines if any of the rays from the cube's origin to each vertex
	//		intersects any face of a mesh in the array of target meshes
	//   for increased collision accuracy, add more vertices to the cube;
	//		for example, new THREE.CubeGeometry( 64, 64, 64, 8, 8, 8, wireMaterial )
	//   HOWEVER: when the origin of the ray is within the target mesh, collisions do not occur
	var originPoint = this.sphereMesh.position.clone();


	if (collidableMeshList) {
		loop: for (var vertexIndex = 0; vertexIndex < this.sphereMesh.geometry.vertices.length; vertexIndex++) {
			var localVertex = this.sphereMesh.geometry.vertices[vertexIndex].clone();
			var globalVertex = localVertex.applyMatrix4(this.sphereMesh.matrix);
			var directionVector = globalVertex.sub(this.sphereMesh.position);

			var ray = new THREE.Raycaster(originPoint, directionVector.clone().normalize());
			var collisionResults = ray.intersectObjects(collidableMeshList);


			if (collisionResults.length > 0 && collisionResults[0].distance < directionVector.length()) {
				if (this.lastCollider != collisionResults[0].object) {

					// console.log("collisionResults[0].distance :" + collisionResults[0].distance);

					// console.log(" Hit ");
					this.lastCollider = collisionResults[0].object;
					this.onCollision(collisionResults[0]);
					// console.log(" collisionResults[0].object " + collisionResults[0].object.rotation.y);
					break loop;
				}
			}
		}
	}

}
Ball.prototype.onCollision = function(collision) {

	// console.log("collision: " + collision.object.position.z);
	// var direction = new THREE.Vector3(0, 0, 0);
	var direction = new THREE.Vector3();
	direction.add(collision.object.parent.rotation);
	direction.add(collision.object.rotation);

	var borderNormal = new THREE.Vector3();

	// Angle to vector3
	borderNormal.x = Math.cos(direction.y * -1);
	borderNormal.z = Math.sin(direction.y * -1);

	// Fix
	this.sphereMesh.position.sub(this.velocity.normalize().multiplyScalar(this.radius - collision.distance));

	// console.log("collision.distance" + collision.distance);
	// console.log("this.velocity.normalize()" + this.velocity.normalize().x);
	// console.log("this.velocity.normalize()" + this.velocity.normalize().y);
	// console.log("this.velocity.normalize()" + this.velocity.normalize().z);
	// console.log("reflect");

	// console.log("parent.rotation.y" + collision.object.parent.rotation.y);
	// console.log("rotation.y" + collision.object.rotation.y);
	// console.log("direction.y" + direction.y);

	//  Bottom border
	if (collision.object.name == "bottom") {
		// console.log("bottom border");

		this.velocity.reflect(borderNormal); //, collision.object.forward);
	}
	// Left border
	else if (collision.object.name == "left") {
		// console.log("left border");
		// console.log("collision.object.parentNode.className "+collision.object.parentNode.className);
		collision.object.parentNode.playerBalls--;
		refreshPlayersInfo();

		this.sphereMesh.position.set(0, 0, 0);

		var direction = new THREE.Vector3(collision.object.position.x, collision.object.position.y, collision.object.position.z);
		direction.add(collision.object.parentNode.position);
		direction.normalize();

		this.velocity.set(direction);

		// this.velocity.reflect(borderNormal); //, collision.object.forward);
	}
	// Top border
	else if (collision.object.name == "top") {
		// console.log("top border");

		this.velocity.reflect(borderNormal); //, collision.object.forward);
	}
	// Racket
	else if (collision.object.name == "racket") {
		//  left / middle / right ?
		var racketPos = new THREE.Vector3();

		racketPos.getPositionFromMatrix(collision.object.matrixWorld);

		var difference = racketPos.sub(this.sphereMesh.position);

		// console.log("racket x: " + racketPos.x);
		// console.log("racket z: " + racketPos.z);

		// console.log("ball x" + this.sphereMesh.position.x);
		// console.log("ball z" + this.sphereMesh.position.z);

		// console.log("-------------");

		difference.normalize();
		difference.multiplyScalar(this.speed);

		this.velocity = difference;
		this.velocity.set(this.velocity.x * -1.0,
			this.velocity.y,
			this.velocity.z * -1.0);

	}


}