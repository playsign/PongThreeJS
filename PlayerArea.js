playerArea = function(position, rotation, pColor, id) {
	this.group = new THREE.Object3D(); //create an empty container

	this.group.rotation.y = rotation;
	this.group.position = position;

	this.rotation = rotation;

	this.bottomTopWidth = 100;
	this.bottomTopHeight = 10;
	this.bottomTopGeometry = new THREE.CubeGeometry(this.bottomTopWidth, this.bottomTopHeight, this.bottomTopHeight, 1, 1, 1);
	this.leftWidth = 120;
	this.leftHeight = 10;
	this.leftGeometry = new THREE.CubeGeometry(this.leftWidth, this.bottomTopHeight, this.bottomTopHeight, 1, 1, 1);

	this.material = new THREE.MeshLambertMaterial({
		color: pColor
	});

	// BORDER BOTTOM 
	// Create mesh
	this.borderBottom = new THREE.Mesh(this.bottomTopGeometry, this.material);
	this.borderBottom.position.set(41.73959, 0, 55);
	this.borderBottom.rotation.y = 180 * (Math.PI / 180);
	this.borderBottom.name = "bottom";
	this.borderBottom.type = "box";

	// Create box physics model
	this.createPhysicsModel(this.bottomTopWidth, this.bottomTopHeight, this.borderBottom, false);


	// BORDER LEFT
	this.borderLeft = new THREE.Mesh(this.leftGeometry, this.material);
	this.borderLeft.position.set(96.05561, 0, 0);
	this.borderLeft.rotation.y = 270 * (Math.PI / 180);
	this.borderLeft.name = "left";
	this.borderLeft.type = "box";
	this.borderLeft.parentNode = this;

	// Create box physics model
	this.createPhysicsModel(this.leftWidth, this.leftHeight, this.borderLeft, false);

	// BORDER TOP
	this.borderTop = new THREE.Mesh(this.bottomTopGeometry, this.material);
	this.borderTop.position.set(41.73959, 0, -55);
	this.borderTop.rotation.y = 360 * (Math.PI / 180);
	this.borderTop.name = "top";
	this.borderTop.type = "box";

	// Create box physics model
	this.createPhysicsModel(this.bottomTopWidth, this.bottomTopHeight, this.borderTop, false);

	// PLAYER RACKET
	this.racketWidth = 30;
	this.racketHeight = 20;
	this.racketGeometry = new THREE.CubeGeometry(this.racketHeight / 2, this.racketHeight / 2, this.racketWidth, 1, 1, 1);
	this.racketMesh = new THREE.Mesh(this.racketGeometry, this.material);
	this.racketMesh.position.set(76, 0, 4);
	this.racketMesh.rotation.y = 180 * (Math.PI / 180);
	this.racketMesh.name = "racket";
	this.racketMesh.type = "box";
	this.racketSpeed = 50;
	this.racketTopStop = this.borderTop.position.z + (this.racketWidth / 2);
	this.racketBottomStop = this.borderBottom.position.z - (this.racketWidth / 2);

	// Create box physics model
	this.createPhysicsModel(this.racketWidth, this.racketHeight, this.racketMesh, true);

	// GROUP
	this.groupMeshes = [];
	this.groupMeshes.push(this.borderBottom);
	this.groupMeshes.push(this.borderLeft);
	this.groupMeshes.push(this.borderTop);

	// PLAYER INFO
	this.playerID = id;
	this.playerName = "Player";
	this.playerBalls = 3;
	this.playerColor = pColor;
}

playerArea.prototype.createPhysicsModel = function(width, height, mesh, racket) {
	var mass = width * height * height;
	var localInertia = new Ammo.btVector3(0, 0, 0);
	var w = width / 2;
	var h = height / 2;
	// quickfix TODO
	var meshClone = mesh.clone();

	var boxShape = null;
	if (racket) {
		boxShape = new Ammo.btBoxShape(new Ammo.btVector3(h, h, w));
		meshClone.position.x += 5;
	} else {
		boxShape = new Ammo.btBoxShape(new Ammo.btVector3(w, h, h));
	}
	boxShape.calculateLocalInertia(mass, localInertia);

	// Local to world pos
	this.group.add(mesh);
	this.group.add(meshClone);
	this.group.updateMatrixWorld();
	var worldPos = new THREE.Vector3();
	worldPos.getPositionFromMatrix(meshClone.matrixWorld);
	this.group.remove(meshClone);
	meshClone = null;
	var startTransform = new Ammo.btTransform();
	startTransform.setIdentity();
	startTransform.setOrigin(new Ammo.btVector3(worldPos.x, 0, worldPos.z));

	// Set rotation
	var worldRot = mesh.rotation.y + this.group.rotation.y;
	var quat = new Ammo.btQuaternion();
	quat.setEuler(worldRot, 0, 0); //or quat.setEulerZYX depending on the ordering you want
	startTransform.setRotation(quat);

	// Create collision object
	var boxAmmo = new Ammo.btCollisionObject();
	boxAmmo.setWorldTransform(startTransform);
	boxAmmo.setCollisionShape(boxShape);
	scene.world.addCollisionObject(boxAmmo);
	boxAmmo.mesh = mesh;
	// set it as ghost object
	boxAmmo.setCollisionFlags(4);
	mesh.collider = boxAmmo;
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
			if (keyboard.pressed("left")) {
				this.racketMesh.position.add(racketForward);
			}
			if (keyboard.pressed("right")) {
				this.racketMesh.position.sub(racketForward);
			}
		} else {
			if (keyboard.pressed("a")) {
				this.racketMesh.position.add(racketForward);
			}
			if (keyboard.pressed("d")) {
				this.racketMesh.position.sub(racketForward);
			}
		}

		// Local to world position
		var worldPos = new THREE.Vector3();
		worldPos.getPositionFromMatrix(this.racketMesh.matrixWorld);
		var transform = this.racketMesh.collider.getWorldTransform();
		transform.setOrigin(new Ammo.btVector3(worldPos.x, 0, worldPos.z));
		this.racketMesh.collider.setWorldTransform(transform);

		if (this.racketMesh.position.z < this.racketTopStop || this.racketMesh.position.z > this.racketBottomStop) {
			this.racketMesh.position = lastPosition;
		}
	}

}