"use strict";
// For conditions of distribution and use, see copyright notice in LICENSE
/*
*	PongThreeJS
*	@author Tapani Jamsa
*	@author Erno Kuusela
*	@author Toni Alatalo
*	Date: 2013
*/

// This script is documented here: https://forge.fi-ware.eu/plugins/mediawiki/wiki/fi-ware-private/index.php/3D-UI_-_WebTundra_-_User_and_Programmers_Guide#Pong_Example

/* jshint -W097, -W040 */
/* global THREE, THREEx, Ammo, window, Director, DirectorScreens */

var app;

function startPongApp(tundraClient, serverHost, serverPort) {
    app = new PongApp(tundraClient);
    if (!serverHost)
        serverHost = "localhost";
    if (!serverPort)
        serverPort = 2345;
    app.tundraClient.connect("ws://" + serverHost + ":" + serverPort);

    function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1) + min);
    }

    // We have configured the app and so we are ready to start it
    app.start();

    // Custom app specific properties
    app.serverGameCtrl = undefined;
    app.racketSpeed = 80;
    app.reservedRacket = undefined;
    app.reservedPlayerArea = undefined;
    app.reservedBorderLeft = undefined;
    app.playerAreaWidth = 100;

    app.dataConnection.loginData = {
	"name": Date.now().toString() + getRandomInt(0, 2000000).toString() //(15)
    };

    console.log("name(id): " + app.dataConnection.loginData.name);

    // Set mesh material colors
    app.viewer.meshReadySig.add(function(meshComp, threeMesh) {
	if (meshComp.parentEntity.placeable !== undefined) {
	    if (meshComp.parentEntity.parent) {
		var entity = meshComp.parentEntity.parent;
		threeMesh.material = new THREE.MeshLambertMaterial({
		    color: entity.componentByType("PlayerArea").color
		});
	    } else {
		console.log("this entity doesn't have a parent");
	    }
	}
    });
}

function PongApp(tundraClient) {
    this.tundraClient = tundraClient;
}

PongApp.prototype.onConnected = function() {
    Tundra.Application.prototype.onConnected.call(this);

    // Set callback function
    this.dataConnection.scene.actionTriggered.add(this.onActionTriggered.bind(this)); //(8)
};

PongApp.prototype.onDisconnected = function() {
    Tundra.Application.prototype.onDisconnected.call(this);

    // DESTROY SCENE OBJECTS
    var removables = [];
    var i = 0;
    for (i = 0; i < this.viewer.scene.children.length; i++) {
	if (this.viewer.scene.children[i] instanceof THREE.Object3D) {
	    removables.push(this.viewer.scene.children[i]);
	}
    }

    for (i = 0; i < removables.length; i++) {
	if (!(removables[i] instanceof THREE.PointLight || removables[i] instanceof THREE.DirectionalLight || removables[i] instanceof THREE.PerspectiveCamera || removables[i] instanceof THREE.OrthographicCamera)) {
	    removables[i].parent.remove(removables[i]);
	}
    }

    // Reset entity references
    this.serverGameCtrl = undefined;
    this.reservedRacket = undefined;
    this.reservedPlayerArea = undefined;
    this.reservedBorderLeft = undefined;
    this.dataConnection.scene.entities = {};
};

PongApp.prototype.logicInit = function() {

    // TOUCH
    this.touchController = new TouchInputController();

    // CAMERA
    var SCREEN_WIDTH = window.innerWidth;
    var SCREEN_HEIGHT = window.innerHeight;
    var NEAR = -20000;
    var FAR = 20000;

    // override camera
    this.camera = new THREE.OrthographicCamera(-SCREEN_WIDTH / 2, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, -SCREEN_HEIGHT / 2, NEAR, FAR); //(1)
    this.cameraPos = new THREE.Vector3(0, 300, 100);
    this.camera.position = this.cameraPos.clone();
    this.camera.lookAt(this.viewer.scene.position);
    this.viewer.camera = this.camera;

    // Background color
    this.viewer.renderer.setClearColor( 0x000000, 0 );

    // Custom resize function because THREEx.windowResize doesn't support orthographic camera
    $(window).on('resize', function() {
	// notify the renderer of the size change
	app.viewer.renderer.setSize(window.innerWidth, window.innerHeight);

	if (app.serverGameCtrl) {
	    app.setCameraPosition(app.serverGameCtrl.componentByType("PlayerAreaList").areaList.length);
	}
    });

    // LIGHTS
    // override point light
    this.viewer.pointLight.position.set(-300, 300, -300);

    // White directional light at half intensity shining from the top.
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    this.directionalLight.position.set(300, 300, 300);
    this.viewer.scene.add(this.directionalLight);

    // DIRECTOR (gui)
    this.gameDirector = new Director();

    // SCENE
    this.sceneCtrl = new SceneController();
};

function sign(x) {
    return x > 0 ? 1 : x < 0 ? -1 : 0;
}

PongApp.prototype.logicUpdate = function(dt) {

    if (this.connected) {
	// RACKET CONTROL
	//(2)
	if (this.reservedRacket !== undefined && this.reservedPlayerArea.placeable !== undefined && (this.keyboard.pressed("left") || this.keyboard.pressed("right") || this.keyboard.pressed("a") || this.keyboard.pressed("d") || this.touchController.swiping /*&& delta.x !== 0)*/ )) {
	    // Get racket's direction vector

	    // Radian
	    var rotation = (this.reservedPlayerArea.placeable.transform.rot.y + 90) * (Math.PI / 180);

	    var racketForward = new THREE.Vector3();

	    // Radian to vector3
	    racketForward.x = Math.cos(rotation * -1);
	    racketForward.z = Math.sin(rotation * -1);

	    racketForward.normalize();

	    // Racket's speed
	    if (this.touchController.swiping) {
		// Touch / Mouse
		racketForward.multiplyScalar(this.racketSpeed * this.touchController.deltaPosition.x * this.touchController.swipeSpeed * -1);
		if (Math.abs(racketForward.length()) > this.racketSpeed) {
		    racketForward.normalize();
		    racketForward.multiplyScalar(this.racketSpeed);
		}
	    } else {
		// Keyboard
		racketForward.multiplyScalar(this.racketSpeed);
	    }

	    // Read keyboard
	    if (this.keyboard.pressed("left") || this.keyboard.pressed("a")) {
		racketForward.multiplyScalar(-1);
	    }

	    // Set a new velocity for the entity
	    this.reservedRacket.rigidBody.linearVelocity = racketForward; //(14)
	    // console.log(racketForward);

	    // Inform the server about the change
	    this.dataConnection.syncManager.sendChanges(); //(3)
	}

	// Players info
	if (this.serverGameCtrl) {
	    this.sceneCtrl.refreshPlayersInfo(this.serverGameCtrl.componentByType("PlayerAreaList").areaList.length);
	}

    }
};

// Set camera position and angle
PongApp.prototype.setCameraPosition = function(playerAmount) {
    console.log("setCameraPosition");

    playerAmount = Math.round(playerAmount);

    // Angle in radians
    var radians = Math.PI * 2 / playerAmount;

    var radius = playerAmount; // * radiusTweak;
    var pivotPoint = 9; // 10 Push player area forward by width of the area

    // Two player tweak to remove gaps between player areas
    if (playerAmount === 2) {
	pivotPoint -= 5; // 4.5 , 5,5
    } else if (playerAmount === 3) {
	pivotPoint -= 0.5; //-0,5
    }

    // Calculate player area offset
    var tHypotenuse = radius;
    var tAngle = radians / 2;
    var tAdjacent = Math.cos(tAngle) * tHypotenuse;
    var playerAreaOffset = radius - tAdjacent;

    radius += radius - playerAreaOffset;

    // update the camera
    var gameAreaDiameter = (radius * 25 + (this.playerAreaWidth * 2)); // TODO 25 the magic number

    var SCREEN_WIDTH = window.innerWidth;
    var SCREEN_HEIGHT = window.innerHeight;
    var ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT;

    if (SCREEN_HEIGHT < SCREEN_WIDTH) {
	this.camera.left = ASPECT * -gameAreaDiameter / 2;
	this.camera.right = ASPECT * gameAreaDiameter / 2;
	this.camera.top = gameAreaDiameter / 2;
	this.camera.bottom = -gameAreaDiameter / 2;
    } else {
	this.camera.left = -gameAreaDiameter / 2;
	this.camera.right = gameAreaDiameter / 2;
	this.camera.top = gameAreaDiameter / 2 / ASPECT;
	this.camera.bottom = -gameAreaDiameter / 2 / ASPECT;
    }

    this.camera.updateProjectionMatrix();

    // Get corresponding three objects
    var borderThreeObject = this.viewer.o3dByEntityId[this.reservedBorderLeft.id];
    var playerAreaThreeObject = this.viewer.o3dByEntityId[this.reservedPlayerArea.id];

    playerAreaThreeObject.updateMatrixWorld();
    borderThreeObject.updateMatrixWorld();

    var worldPos = new THREE.Vector3();
    worldPos.setFromMatrixPosition(borderThreeObject.matrixWorld);

    // Change camera position temporarily so we get a correct camera angle
    this.camera.position.x = worldPos.x;
    this.camera.position.y = this.cameraPos.y;
    this.camera.position.z = worldPos.z;
    this.camera.lookAt(playerAreaThreeObject.position);

    // Move camera back to the center
    this.camera.position = new THREE.Vector3(0, 10, 0);

};

// Action triggered callback
PongApp.prototype.onActionTriggered = function(scope, param2, param3, param4) {
    console.log("onActionTriggered");

    if (param2 === "sceneGenerated") {
	// The scene is (re)generated
	this.getEntities();
    }

    // Someone lost the game
    else if (param2 === "gameover") {
	this.gameOver(param3[1], param3[2]);
    }
};

// Game over callback
PongApp.prototype.gameOver = function(playerID, placement) { //(9)
    var createDialog = function(dialogText) { //(10)
	// jQuery dialog
	var newDialog = 123321;
	$("body").append("<div id=" + newDialog + " title='Game Over'>" + dialogText + "</div>");
	$("#" + newDialog).dialog({
	    width: 300,
	    height: "auto",
	});
    };

    if (playerID == this.dataConnection.loginData.name) {
	createDialog("You're out of balls. Placement: " + placement);
    } else if (placement == 2) {
	// We have a silver medalist and it's not you
	createDialog("You won!");
    }
};

PongApp.prototype.getEntities = function() {
    console.log("getEntities");

    this.reservedRacket = undefined;
    this.reservedPlayerArea = undefined;

    // Find a player area that matches with the player
    this.serverGameCtrl = this.dataConnection.scene.entityByName("GameController"); //(4)
    var areaList = this.serverGameCtrl.componentByType("PlayerAreaList").areaList;
    var scene = this.dataConnection.scene;
    for (var i = 0; i < areaList.length; i++) {
	var entityID = areaList[i];
	var entity = scene.entityById(entityID);
	if (!entity) {
	    throw "entity not found";
	}
	var areaComp = entity.componentByType("PlayerArea");
	if (areaComp.playerID == this.dataConnection.loginData.name) {
	    // Set player area entity references
	    var racketRef = areaComp.racketRef; //(5)
	    var borderLeftRef = areaComp.borderLeftRef;
	    this.reservedRacket = scene.entityById(racketRef); //(6)
	    this.reservedBorderLeft = scene.entityById(borderLeftRef);
	    this.reservedPlayerArea = entity;

	    break;
	}
    }

    if (this.reservedPlayerArea !== undefined) {
	this.setCameraPosition(areaList.length);
    }
};

