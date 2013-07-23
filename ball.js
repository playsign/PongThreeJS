function Ball(material) {
	this.speed = 50;
	this.velocity = new THREE.Vector3(this.speed, 0, this.speed);

	this.sphereGeometry = new THREE.SphereGeometry(5, 16, 16);

	this.sphereMesh = new THREE.Mesh(this.sphereGeometry, material);
	this.sphereMesh.position.set(0, 0, 0);

	this.debugThing = true;
	this.debugThing2 = 0;
}

Ball.prototype.update = function(collidableMeshList) // Define Method
{
	// console.log("update");
	var delta = clock.getDelta(); // seconds.
	// var moveDistance = 200 * delta; // 200 pixels per second
	var moveDistance = new THREE.Vector3(this.velocity.x * delta, this.velocity.y * delta, this.velocity.z * delta);

	this.sphereMesh.position.add(moveDistance);

	// console.log("this.sphereMesh.position.x: "+moveDistance.x);

	// MovingCube.position.x -= moveDistance;

	if (this.debugThing == false) {
		this.debugThing2 += delta;
	}
	if (this.debugThing2 > 0.1) {
		this.debugThing = true;
		this.debugThing2 = 0;
		console.log("reset");
	}

	// Collision detection:
	//   determines if any of the rays from the cube's origin to each vertex
	//		intersects any face of a mesh in the array of target meshes
	//   for increased collision accuracy, add more vertices to the cube;
	//		for example, new THREE.CubeGeometry( 64, 64, 64, 8, 8, 8, wireMaterial )
	//   HOWEVER: when the origin of the ray is within the target mesh, collisions do not occur
	var originPoint = this.sphereMesh.position.clone();

	// clearText();

	if (collidableMeshList) {
		for (var vertexIndex = 0; vertexIndex < this.sphereMesh.geometry.vertices.length; vertexIndex++) {
			var localVertex = this.sphereMesh.geometry.vertices[vertexIndex].clone();
			var globalVertex = localVertex.applyMatrix4(this.sphereMesh.matrix);
			var directionVector = globalVertex.sub(this.sphereMesh.position);

			var ray = new THREE.Raycaster(originPoint, directionVector.clone().normalize());
			var collisionResults = ray.intersectObjects(collidableMeshList);
			if (collisionResults.length > 0 && collisionResults[0].distance < directionVector.length()) {
				// console.log(" Hit ");
				this.onCollision(collisionResults[0]);
			}
		}
	}

}
Ball.prototype.onCollision = function(collision) {
	if (this.debugThing) {

		console.log("collision: " + collision.object.position.z);
		// var direction = new THREE.Vector3(0, 0, 0);
		var direction = new THREE.Vector3();
		direction.add(collision.object.parent.rotation);
		direction.add(collision.object.rotation);

		var borderNormal = new THREE.Vector3();

		// Angle to vector3
		borderNormal.x = Math.cos(direction.y * -1);
		borderNormal.z = Math.sin(direction.y * -1);


		console.log("parent.rotation.y" + collision.object.parent.rotation.y);
		console.log("rotation.y" + collision.object.rotation.y);
		console.log("direction.y" + direction.y);

		console.log("borderNormal.x" + borderNormal.x);
		console.log("borderNormal.z" + borderNormal.z);

		//  Bottom border
		if (collision.object.position.z == 55) {
			console.log("bottom border");

			this.velocity.reflect(borderNormal); //, collision.object.forward);
		}
		// Left border
		else if (collision.object.position.z == 0) {
			console.log("left border");

			this.velocity.reflect(borderNormal); //, collision.object.forward);
		}
		// Top border
		else if (collision.object.position.z == -55) {
			console.log("top border");

			this.velocity.reflect(borderNormal); //, collision.object.forward);
		}

		this.debugThing = false;
	}
}