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
/* jslint browser: true, debug: true, devel: true */
/* global THREE, THREEx, Ammo, window, Director, DirectorScreens, TouchInputController */

var PongApp = {};

PongApp.start = function(serverHost, serverPort) {

    if (!serverHost)
        serverHost = "localhost";
    if (!serverPort)
        serverPort = 2345;
    var cparams = {
        container     : "#webtundra-container-custom",
        renderSystem  : ThreeJsRenderer
    };
    var loginData = {
	"name": "PongPlayer_" + (Date.now() + Math.random()).toFixed(5)
    };
    this.areasExpected = {};
    this.tundraClient = new window.TundraClient(cparams);
    this.tundraClient.connect("ws://" + serverHost + ":" + serverPort,
                             loginData);

    var redirectPlugin = TundraSDK.plugin("AssetRedirectPlugin");
    redirectPlugin.registerAssetTypeSwap(".mesh", ".json", "ThreeJsonMesh");
    redirectPlugin.setupDefaultStorage();

    this.threeScene = this.tundraClient.renderer.scene;
    this.threeRenderer = this.tundraClient.renderer.renderer;
    this.tundraClient.onConnected(null, this.handleConnected.bind(this));    
    // this.tundraClient.scene.onEntityCreated(
    //     null, this.handleEntityCreated.bind(this));


    //var camera = new THREE.PerspectiveCamera(45, 1, 1, 1000);

    this.logicInit();
};

PongApp.getThreeCamera = function() {
    return this.tundraClient.renderer.camera;
};

PongApp.handleConnected = function() {
    // Custom app specific properties
    this.serverGameCtrl = undefined;
    this.racketSpeed = 80;
    this.reservedRacket = undefined;
    this.reservedPlayerArea = undefined;
    this.reservedBorderLeft = undefined;
    this.playerAreaWidth = 100;
    // this.freecamera.cameraEntity.placeable.setPosition(this.cameraPos.x, this.cameraPos.y, this.cameraPos.z);
    console.log("Connected, username: " + this.tundraClient.loginProperties.name);

    // Set mesh material colors
    // TBD: reimplement for WT2
    //app.viewer.meshReadySig.add(function(meshComp, threeMesh) {
    //     if (meshComp.parentEntity.placeable !== undefined) {
    //         if (meshComp.parentEntity.parent) {
    //          var entity = meshComp.parentEntity.parentScene.entities[parentPlayerAreaID];
    //          threeMesh.material = new THREE.MeshLambertMaterial({
    //                 color: entity.dynamiccomponent.color
    //          });
    //         } else {
    //          console.log("this entity doesn't have a parent");
    //         }
    //     }
    // });        
    
    this.tundraClient.scene.onEntityAction(
        null, this.handleEntityAction.bind(this)); // (8)
    
    this.tundraClient.onDisconnected(
        null, this.handleDisconnected.bind(this));

    // this.makeCube(this.threeScene); // test to debug blank screen and such        


    if (false) {
        var fun = function() {
        //var renderer = new THREE.WebGLRenderer();
        //renderer.setSize(500, 500);
        //document.body.appendChild(renderer.domElement);
        var camera = new THREE.PerspectiveCamera(45, 1, 1, 1000);
        camera.position.z = 500;
        var scene = new THREE.Scene();
        this.makeCube(scene); // test to debug blank screen and such        
        camera.lookAt(this.cube);
        //this.tundraClient.renderer.renderer = renderer;
        this.tundraClient.renderer.camera = camera;
            console.log("sss");
        }.bind(this);
        window.setTimeout(fun, 1000);
    }
};

PongApp.makeCube = function(scene) {
    var scene = scene || this.threeScene;
    var geometry = new THREE.CubeGeometry(100, 100, 100);
    var material = new THREE.MeshNormalMaterial();
    var cube = new THREE.Mesh(geometry, material);
    cube.overdraw = true;
    this.cube = cube;
    cube.name = "testcube";
    scene.add(cube);
    cube.position.set(0, 0, 0);
    console.log("inserted test cube in scene");
};

PongApp.getThreeBall = function() {
    return this.threeScene.getObjectByName("Sphere");
};

PongApp.handleDisconnected = function() {
    // WT2 handles three scene disposal

    // Reset entity references
    this.serverGameCtrl = undefined;
    this.reservedRacket = undefined;
    this.reservedPlayerArea = undefined;
    this.reservedBorderLeft = undefined;
    this.dataConnection.scene.entities = {};
};

PongApp.logicInit = function() {

    // TOUCH
    this.touchController = new TouchInputController();

    // CAMERA
    var SCREEN_WIDTH = window.innerWidth;
    var SCREEN_HEIGHT = window.innerHeight;
    var NEAR = -20000;
    var FAR = 20000;

    // // Start freecam app
    // var thisIsThis = this;
    // $.getScript("js/freecamera.js")
    //     .done(function( script, textStatus ) {
    //         thisIsThis.freecamera = new FreeCameraApplication();
    //         thisIsThis.camera = thisIsThis.tundraClient.renderer.camera;
    //     })
    //     .fail(function(jqxhr, settings, exception) {
    //         console.error("Failed to load FreeCamera application:", exception);
    //     }              
    // );

    // // override camera
    this.camera = new THREE.OrthographicCamera(-SCREEN_WIDTH / 2, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, -SCREEN_HEIGHT / 2, NEAR, FAR); //(1)
    this.cameraPos = new THREE.Vector3(0, 300, 100);
    this.camera.position = this.cameraPos.clone();
    this.camera.lookAt(this.threeScene.position);

    this.tundraClient.renderer.camera = this.camera;

    // Background color
    this.threeRenderer.setClearColor( 0x000000, 0 );

    // Custom resize function because THREEx.windowResize doesn't support orthographic camera
    $(window).on('resize', function() {
        // notify the renderer of the size change
        this.threeRenderer.setSize(window.innerWidth, window.innerHeight);

        if (this.serverGameCtrl) {
            this.setCameraPosition(this.serverGameCtrl.dynamicComponent.playerAreas.length);
        }
    }.bind(this));

    // LIGHTS

    this.pointLight = new THREE.PointLight(0xffffff, 1, 100);
    this.pointLight.position.set(-300, 300, -300);

    // White directional light at half intensity shining from the top.
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    this.directionalLight.position.set(300, 300, 300);
    this.threeScene.add(this.directionalLight);

    // DIRECTOR (gui)
    this.gameDirector = new Director();

    // SCENE
    this.sceneCtrl = new SceneController();
};

function sign(x) {
    return x > 0 ? 1 : x < 0 ? -1 : 0;
}

PongApp.logicUpdate = function(dt) {

    if (this.tundraClient.IsConnected()) {
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
            this.sceneCtrl.refreshPlayersInfo(this.serverGameCtrl.dynamicComponent.playerAreas.length);
        }

    }
};

// Set camera position and angle
PongApp.setCameraPosition = function(playerAmount) {
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


PongApp.handleEntityAction = function(action) {
    console.log("got entityAction " + action.name);

    if (action.name === "sceneGenerated") {
	// The scene is (re)generated
	this.getEntities();
    }

    // Someone lost the game
    else if (action.name === "gameover") {
	this.gameOver(action.parameters[1], action.parameters[2]);
    }
};

// Game over callback
PongApp.gameOver = function(playerID, placement) { //(9)
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

PongApp.getEntities = function() {
    console.log("getEntities");

    this.reservedRacket = undefined;
    this.reservedPlayerArea = undefined;

    // Find a player area that matches with the player
    this.serverGameCtrl = this.tundraClient.scene.entityByName("GameController"); //(4)

    var playerAmount = this.serverGameCtrl.dynamicComponent.playerAreas.length;
    for (var i = 0; i < this.serverGameCtrl.dynamicComponent.playerAreas.length; i++) {
        var entityID = parseInt(this.serverGameCtrl.dynamicComponent.playerAreas[i]);
        var entity = this.tundraClient.scene.entityById(entityID);        
        if (!entity) {
            debugger;
            this.areasExpected[entityID] = true;
            console.log("missing playerArea: index " + i + " had entityID " + entityID);       
            console.log("putting on waiting list", typeof entityID);

        } else {
            console.log("got area on time");
            //this.playerAreaEntityAppeared(entity);
            this.gotPlayerArea(entity);
        }
    }

    if (this.reservedPlayerArea !== undefined) {
	this.setCameraPosition(areaList.length);
    }
};

PongApp.gotPlayerArea = function(areaEnt) {
    var tclient = this.tundraClient, dc = areaEnt.dynamicComponent;
    if (dc && dc.playerID === tclient.loginProperties.name) {
        console.log("my playerArea found");
        // Set player area areaEnt references
        var racketRef = dc.racketRef; //(5)
        var borderLeftRef = dc.borderLeftRef;
        this.reservedRacket = tclient.scene.entityById(racketRef); //(6)
        this.reservedBorderLeft = tclient.scene.entityById(borderLeftRef);
    }
};

// PongApp.handleEntityCreated = function(entity) {    
//     var x = this.areasExpected;
//     if (!x[entity.id]) {
//         console.log("blah " + entity.id, !!this.tundraClient.scene.entityById(entity.id));
//         return;
//     }
//     console.log("got area eid=" + entity.id + " as expected");
//     x[entity.id] = false;    
//     this.playerAreaEntityAppeared(entity);
// };


// debug helpers;
function d_cam() { return PongApp.getThreeCamera(); }
function d_ball() { return PongApp.threeScene.getObjectByName("Sphere"); }
function d_cube() { return PongApp.threeScene.getObjectByName("testcube"); }

PongApp.start();

// function cubetest() {
//     var diy = true;
//     console.log("cubetest");
//     var cube, scene;
//     if (diy) {
//         var geometry = new THREE.CubeGeometry(100, 100, 100);
//         var material = new THREE.MeshNormalMaterial();
//         cube = new THREE.Mesh(geometry, material);
//         cube.overdraw = true;
//         cube.name = "testcube";
//         scene = new THREE.Scene();
//     } else {
//         cube = PongApp.cube.clone();
//         scene = PongApp.threeScene;
//     }
//         scene.add(cube);
//     cube.position.set(0, 0, 0);
//     console.log("inserted test cube in scene");

//     var renderer = new THREE.WebGLRenderer();
    
//     //var renderer = PongApp.tundraClient.renderer.renderer;
//     renderer.setSize(500, 500);
//     var canvasdiv = document.getElementById("webtundra-container-custom");
//     console.log(canvasdiv.id);
//     canvasdiv.appendChild(renderer.domElement);
//     var camera = new THREE.PerspectiveCamera(45, 1, 1, 1000);
//     camera.position.z = 500;
//     cube.rotation.x += 1;
//     renderer.render(scene, camera);
// }

// window.setTimeout(cubetest, 1000);
