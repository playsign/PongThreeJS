// var PlayerArea = {};

// PlayerArea.AreaObject = function(material, position, rotation) {
playerArea = function(material, position, rotation) {

	this.group = new THREE.Object3D(); //create an empty container
	// this.pivotPoint = 10;
	this.group.rotation.y = rotation;
	this.group.position = position;

	// this.position = position;
	this.rotation = rotation;

	this.bottomTopGeometry = new THREE.CubeGeometry(100, 10, 10, 1, 1, 1);
	this.leftGeometry = new THREE.CubeGeometry(120, 10, 10, 1, 1, 1);
	// this.material = new THREE.MeshLambertMaterial({
	// 	color: 0x000088
	// });

	this.material = material;

	this.borderBottom = new THREE.Mesh(this.bottomTopGeometry, this.material);
	this.borderBottom.position.set(41.73959, 0, 55);
	this.borderBottom.rotation.y = 180 * (Math.PI / 180);

	this.borderLeft = new THREE.Mesh(this.leftGeometry, this.material);
	this.borderLeft.position.set(96.05561, 0, 0);
	this.borderLeft.rotation.y = 90 * (Math.PI / 180);

	this.borderTop = new THREE.Mesh(this.bottomTopGeometry, this.material);
	this.borderTop.position.set(41.73959, 0, -55);
	this.borderTop.rotation.y = 180 * (Math.PI / 180);

	this.group.add(this.borderBottom);
	this.group.add(this.borderLeft);
	this.group.add(this.borderTop);

	// console.log("this.position.x, : " + this.position.x);
	// console.log("this.position.z : " + this.position.z);
}