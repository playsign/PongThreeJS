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
                throw("undefined value, arg #" + i);
            }
        }
    }
}

function copyXyz(src, dst) {
    dst.x = src.x; dst.y = src.y; dst.z = src.z;
}
function copyXyzMapped(src, dst, mapfun) {
    dst.x = mapfun(src.x); dst.y = mapfun(src.y); dst.z = mapfun(src.z);
}

function degToRad(val) {
    return val * (Math.PI/180);
}

function updateFromTransform(threeMesh, placeable) {
    checkDefined(placeable, threeMesh);   
    copyXyz(placeable.transform.value.pos, threeMesh.position);
    copyXyz(placeable.transform.value.scale, threeMesh.scale);
    copyXyzMapped(placeable.transform.value.rot, threeMesh.rotation, degToRad);
    threeMesh.needsUpdate = true;
}

function ThreeView() {
    var container = document.createElement('div');
    THREEx.FullScreen.bindKey({
	charCode: 'm'.charCodeAt(0)
    });
    this.objectsByEntityId = {};
    this.meshCache = {};
    document.body.appendChild(container);
    this.renderer = new THREE.WebGLRenderer();
    container.appendChild(this.renderer.domElement);
    this.camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 1000 );
    this.camera.position.y = 10;
    this.camera.position.z = 24;

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    THREEx.WindowResize(this.renderer, this.camera);

    this.scene = new THREE.Scene();
    this.scene.add(this.camera);
    // this.projector = new THREE.Projector();
    // var thisIsThis = this;
    // document.addEventListener( 'mousedown', function(event) {
    //     var ray = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );
    //     var mouseVector = new THREE.Vector3( mouse.x, mouse.y, 1 );
    //     thisIsThis.projector.unprojectVector( mouseVector, camera );
    //     var intersects = ray.intersectObjects(attributeValues(thisIsThis.objectsByEntityId));
    // }, false );

    this.pointLight = new THREE.PointLight(0xffffff);
    this.pointLight.position.set(-100,200,100);
    this.scene.add(new THREE.AmbientLight(0x6b6b6b));
    
    var geometry = new THREE.CubeGeometry( 2, 2, 2 );

    for ( var i = 0; i < geometry.faces.length; i += 2 ) {
        var hex = Math.random() * 0xffffff;
        geometry.faces[ i ].color.setHex( hex );
        geometry.faces[ i + 1 ].color.setHex( hex );
    }
    var material = new THREE.MeshBasicMaterial( { vertexColors: THREE.FaceColors, overdraw: 0.5 } );
    this.cubeGeometry = geometry;
    this.cubeMaterial = material;
    this.wireframeMaterial = new THREE.MeshBasicMaterial( { color: 0x00ee00, wireframe: true, transparent: true } );

    // debug
    this.entitiesSeen = {};
    this.entitiesWithMeshesSeen = {};

}

ThreeView.prototype.render = function() {
    checkDefined(this.scene, this.camera);
    this.renderer.render(this.scene, this.camera);
    
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
            jsonLoad(url,
                     function (geometry, material) {                        
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