// var PlayerArea = {};

// PlayerArea.AreaObject = function(material, position, rotation) {
playerArea = function(position, rotation, pColor, id) {

	this.group = new THREE.Object3D(); //create an empty container

	this.group.rotation.y = rotation;
	this.group.position = position;

	this.rotation = rotation;

	this.bottomTopGeometry = new THREE.CubeGeometry(100, 10, 10, 1, 1, 1);
	this.leftGeometry = new THREE.CubeGeometry(120, 10, 10, 1, 1, 1);

	this.material = new THREE.MeshLambertMaterial({
		color: pColor
	});

	this.borderBottom = new THREE.Mesh(this.bottomTopGeometry, this.material);
	this.borderBottom.position.set(41.73959, 0, 55);
	this.borderBottom.rotation.y = 180 * (Math.PI / 180);
	this.borderBottom.name = "bottom";

	this.borderLeft = new THREE.Mesh(this.leftGeometry, this.material);
	this.borderLeft.position.set(96.05561, 0, 0);
	this.borderLeft.rotation.y = 90 * (Math.PI / 180);
	this.borderLeft.name = "left";
	this.borderLeft.parentNode = this;

	this.borderTop = new THREE.Mesh(this.bottomTopGeometry, this.material);
	this.borderTop.position.set(41.73959, 0, -55);
	this.borderTop.rotation.y = 180 * (Math.PI / 180);
	this.borderTop.name = "top";

	// Player Racket
	this.racketWidth = 30;
	this.racketGeometry = new THREE.CubeGeometry(10, 10, this.racketWidth, 1, 1, 1);
	this.racketMesh = new THREE.Mesh(this.racketGeometry, this.material);
	this.racketMesh.position.set(76, 0, 4);
	this.racketMesh.rotation.y = 180 * (Math.PI / 180);
	this.racketMesh.name = "racket";
	this.racketSpeed = 50;
	// this.racketLastPosition = new THREE.Vector3(0, 0, 0);
	this.racketTopStop = this.borderTop.position.z + (this.racketWidth / 2);
	this.racketBottomStop = this.borderBottom.position.z - (this.racketWidth / 2);

	this.group.add(this.borderBottom);
	this.group.add(this.borderLeft);
	this.group.add(this.borderTop);
	this.group.add(this.racketMesh);

	this.groupMeshes = [];
	this.groupMeshes.push(this.borderBottom);
	this.groupMeshes.push(this.borderLeft);
	this.groupMeshes.push(this.borderTop);

	// Player info
	this.playerID = id;
	this.playerName = "Player";
	this.playerBalls = 3;
	this.playerColor = pColor;
}

playerArea.prototype.update = function(collidableMeshList, delta) {

	var lastPosition = this.racketMesh.position.clone();
	// Racket controls
	if (keyboard.pressed("left") || keyboard.pressed("right") || keyboard.pressed("a") || keyboard.pressed("d")) {
		var racketForward = new THREE.Vector3();

		var rotation = this.racketMesh.rotation.y + (90 * (Math.PI / 180));

		// Angle to vector3
		racketForward.x = Math.cos(rotation * -1);
		racketForward.z = Math.sin(rotation * -1);


		racketForward.normalize();

		racketForward.multiplyScalar(this.racketSpeed * delta);

		if (this.playerID == 1) {
			if (keyboard.pressed("left"))
				this.racketMesh.position.add(racketForward);
			if (keyboard.pressed("right"))
				this.racketMesh.position.sub(racketForward);
		} else {
			if (keyboard.pressed("a"))
				this.racketMesh.position.add(racketForward);
			if (keyboard.pressed("d"))
				this.racketMesh.position.sub(racketForward);
		}

		if (this.racketMesh.position.z < this.racketTopStop || this.racketMesh.position.z > this.racketBottomStop) {
			this.racketMesh.position = lastPosition;
		}
	}

}