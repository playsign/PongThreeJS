"use strict";
// For conditions of distribution and use, see copyright notice in LICENSE
/*
 *	@author Erno Kuusela
 * 	@author Tapani Jamsa
 */

var useCubes = false;

function jsonLoad(url, addCallback) {
	var loader = new THREE.JSONLoader();
	loader.load(url, function(geometry, material) {
		addCallback(geometry, material);
	});
}

var debugOnCheckFail = true;

function checkDefined() {
	for (var i = 0; i < arguments.length; i++) {
		if (arguments[i] === undefined) {
			if (debugOnCheckFail) {
				debugger;
			} else {
				throw ("undefined value, arg #" + i);
			}
		}
	}
}

function copyXyz(src, dst) {
	dst.x = src.x;
	dst.y = src.y;
	dst.z = src.z;
}

function copyXyzMapped(src, dst, mapfun) {
	dst.x = mapfun(src.x);
	dst.y = mapfun(src.y);
	dst.z = mapfun(src.z);
}

function degToRad(val) {
	return val * (Math.PI / 180);
}

function updateFromTransform(threeMesh, placeable) {
	checkDefined(placeable, threeMesh);
	copyXyz(placeable.transform.value.pos, threeMesh.position);
	copyXyz(placeable.transform.value.scale, threeMesh.scale);
	copyXyzMapped(placeable.transform.value.rot, threeMesh.rotation, degToRad);
	threeMesh.needsUpdate = true;
}

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
	// checkDefined(this.sceneCtrl.scene, this.sceneCtrl.camera);
	this.renderer.render(this.sceneCtrl.scene, this.sceneCtrl.camera);

};

ThreeView.prototype.addOrUpdate = function(entity, placeable, meshComp) {
	checkDefined(entity, placeable, meshComp);
	checkDefined(entity.id);
	var cube = this.objectsByEntityId[entity.id];
	var url = meshComp.meshRef.value.ref;
	if (url === 'sphere.mesh')
		url = 'android.js';
	if (cube === undefined) {
		if (useCubes) {
			cube = new THREE.Mesh(this.cubeGeometry, this.wireframeMaterial);
			this.objectsByEntityId[entity.id] = cube;
			this.scene.add(cube);
		} else if (url === 'lightsphere.mesh') {
			this.objectsByEntityId[entity.id] = this.pointLight;
			this.scene.add(this.pointLight);
			updateFromTransform(this.pointLight, placeable);
		} else {
			url = url.replace(/\.mesh$/i, ".json")
			var entitiesForUrl = this.meshCache[url];
			var firstRef = false;
			if (entitiesForUrl === undefined) {
				this.meshCache[url] = entitiesForUrl = [];
				firstRef = true;
			}
			entitiesForUrl.push(entity);
			if (!firstRef)
				return;
			console.log("new mesh ref:", url);
			var thisIsThis = this;
			jsonLoad(url, function(geometry, material) {
				thisIsThis.addMeshToEntities(geometry, material, url);
				//updateFromTransform(threeMesh, placeable);
				console.log("loaded & updated to scene:", url);
			});
		}
	} else {
		updateFromTransform(cube, placeable);
	}
};

ThreeView.prototype.addMeshToEntities = function(geometry, material, url) {
	var entities = this.meshCache[url];
	checkDefined(entities);
	//material = new THREE.MeshBasicMaterial( { vertexColors: THREE.FaceColors, overdraw: 0.5 } );
	for (var i = 0; i < entities.length; i++) {
		var ent = entities[i];
		check(ent instanceof Entity);
		var pl = ent.componentByType("Placeable");
		var mesh = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(material));
		updateFromTransform(mesh, pl);
		this.scene.add(mesh);
		this.objectsByEntityId[ent.id] = mesh;
		mesh.userData.entityId = ent.id;
	}
	entities.length = 0;
};