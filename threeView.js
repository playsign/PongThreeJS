"use strict";
// For conditions of distribution and use, see copyright notice in LICENSE
/*
 *	@author Erno Kuusela
 * 	@author Tapani Jamsa
 */

var useCubes = false;

function ThreeView(sceneCtrl) {
	// Pointer to global
	this.sceneCtrl = sceneCtrl;

	this.objectsByEntityId = {};
	this.meshCache = {};

	// DAT GUI
	this.gui = new dat.GUI();
	this.gui.add(this.sceneCtrl, 'playerAmount').min(2).max(100).step(1).listen();
	this.gui.close();
	this.gui.domElement.style.position = 'absolute';
	this.gui.domElement.style.right = '0px';
	// gui.domElement.style.zIndex = 100;
	this.gui.add(this.sceneCtrl.ball, 'speed').min(0.1).max(400).step(0.1).listen();

	// STATS
	this.stats = new Stats();
	this.stats.domElement.style.position = 'absolute';
	this.stats.domElement.style.bottom = '0px';
	this.stats.domElement.style.zIndex = 100;

	// RENDERER    
	if (Detector.webgl)
		this.renderer = new THREE.WebGLRenderer({
			antialias: true
		});
	else
		this.renderer = new THREE.CanvasRenderer();
	this.renderer.setSize(window.innerWidth, window.innerHeight);

	// EVENTS
	THREEx.WindowResize(this.renderer, this.sceneCtrl.camera);
	THREEx.FullScreen.bindKey({
		charCode: 'm'.charCodeAt(0)
	});

	// CONTAINER
	this.container = document.getElementById('ThreeJS');
	this.container.appendChild(this.gui.domElement);
	this.container.appendChild(this.stats.domElement);
	this.container.appendChild(this.renderer.domElement);
	document.body.appendChild(this.container);

	// debug
	this.entitiesSeen = {};
	this.entitiesWithMeshesSeen = {};
}

ThreeView.prototype.render = function() {
	// this.checkDefined(this.sceneCtrl.scene, this.sceneCtrl.camera);
	this.renderer.render(this.sceneCtrl.scene, this.sceneCtrl.camera);

};

ThreeView.prototype.addOrUpdate = function(entity, placeable, meshComp) {
	// console.clear();
	// console.log(entity);
	// console.log(placeable);
	// console.log(meshComp);

	this.checkDefined(entity, placeable, meshComp);
	this.checkDefined(entity.id);

	var url = meshComp.meshRef.value.ref;
	if (url === 'Sphere.mesh') {
		this.updateFromTransform(this.sceneCtrl.ball.sphereMesh, placeable);
	}

	// this.checkDefined(entity, placeable, meshComp);
	// this.checkDefined(entity.id);
	// var cube = this.objectsByEntityId[entity.id];
	// var url = meshComp.meshRef.value.ref;
	// if (url === 'sphere.mesh')
	// 	url = 'android.js';
	// if (cube === undefined) {
	// 	if (useCubes) {
	// 		cube = new THREE.Mesh(this.cubeGeometry, this.wireframeMaterial);
	// 		this.objectsByEntityId[entity.id] = cube;
	// 		this.scene.add(cube);
	// 	} else if (url === 'lightsphere.mesh') {
	// 		this.objectsByEntityId[entity.id] = this.pointLight;
	// 		this.scene.add(this.pointLight);
	// 		this.updateFromTransform(this.pointLight, placeable);
	// 	} else {
	// 		url = url.replace(/\.mesh$/i, ".json")
	// 		var entitiesForUrl = this.meshCache[url];
	// 		var firstRef = false;
	// 		if (entitiesForUrl === undefined) {
	// 			this.meshCache[url] = entitiesForUrl = [];
	// 			firstRef = true;
	// 		}
	// 		entitiesForUrl.push(entity);
	// 		if (!firstRef)
	// 			return;
	// 		console.log("new mesh ref:", url);
	// 		var thisIsThis = this;
	// 		jsonLoad(url, function(geometry, material) {
	// 			thisIsThis.addMeshToEntities(geometry, material, url);
	// 			//this.updateFromTransform(threeMesh, placeable);
	// 			console.log("loaded & updated to scene:", url);
	// 		});
	// 	}
	// } else {
	// 	this.updateFromTransform(cube, placeable);
	// }
};

ThreeView.prototype.addMeshToEntities = function(geometry, material, url) {
	var entities = this.meshCache[url];
	this.checkDefined(entities);
	//material = new THREE.MeshBasicMaterial( { vertexColors: THREE.FaceColors, overdraw: 0.5 } );
	for (var i = 0; i < entities.length; i++) {
		var ent = entities[i];
		check(ent instanceof Entity);
		var pl = ent.componentByType("Placeable");
		var mesh = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(material));
		this.updateFromTransform(mesh, pl);
		this.scene.add(mesh);
		this.objectsByEntityId[ent.id] = mesh;
		mesh.userData.entityId = ent.id;
	}
	entities.length = 0;
};

ThreeView.prototype.checkDefined = function() {
	for (var i = 0; i < arguments.length; i++) {
		if (arguments[i] === undefined) {
			if (debugOnCheckFail) {
				debugger;
			} else {
				throw ("undefined value, arg #" + i);
			}
		}
	}
};

ThreeView.prototype.jsonLoad = function(url, addCallback) {
	var loader = new THREE.JSONLoader();
	loader.load(url, function(geometry, material) {
		addCallback(geometry, material);
	});
};

var debugOnCheckFail = true;

ThreeView.prototype.copyXyz = function(src, dst) {
	dst.x = src.x;
	dst.y = src.y;
	dst.z = src.z;
};

ThreeView.prototype.copyXyzMapped = function(src, dst, mapfun) {
	dst.x = mapfun(src.x);
	dst.y = mapfun(src.y);
	dst.z = mapfun(src.z);
};

ThreeView.prototype.degToRad = function(val) {
	return val * (Math.PI / 180);
};

ThreeView.prototype.updateFromTransform = function(threeMesh, placeable) {
	this.checkDefined(placeable, threeMesh);
	this.copyXyz(placeable.transform.value.pos, threeMesh.position);
	this.copyXyz(placeable.transform.value.scale, threeMesh.scale);
	this.copyXyzMapped(placeable.transform.value.rot, threeMesh.rotation, this.degToRad);
	threeMesh.needsUpdate = true;
};