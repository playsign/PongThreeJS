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
    // entry point for app
    if (!serverHost)
        serverHost = "localhost";
    if (!serverPort)
        serverPort = 2345;
    this.serverHost = serverHost;
    this.serverPort = serverPort;
    var cparams = {
        container     : "#webtundra-container-custom",
        renderSystem  : ThreeJsRenderer
    };
    this.tundraClient = new window.TundraClient(cparams);

    // DIRECTOR (gui)
    this.gameDirector = new Director();
    this.gameDirector.setScreen(DirectorScreens.controls);
    //this.showHelp();
    window.setTimeout(function(){this.hideHack();}.bind(this), 3000);
    $("#onlineButton").show();

/*
    var redirectPlugin = TundraSDK.plugin("AssetRedirectPlugin");
    redirectPlugin.registerAssetTypeSwap(".mesh", ".json", "ThreeJsonMesh");
    redirectPlugin.setupDefaultStorage();
*/

    this.threeScene = this.tundraClient.renderer.scene;
    this.threeRenderer = this.tundraClient.renderer.renderer;
    this.tundraClient.onConnected(null, this.handleConnected.bind(this));    

    this.tundraClient.frame.onUpdate(
        null, this.handleFrameUpdate.bind(this));    

    this.gameLogicInit();
};

PongApp.hideHack = function() {
    var h = ["title", "infoButton", "continueButton", "okButton", "menuButton", "helpOnline"];
    for (var i = 0; i < h.length; i++) {
        $("#" + h[i]).hide();
        console.log("hide " + h[i]);
    }
};

PongApp.connect = function() {
    Tundra.asset.setHttpProxyResolver(undefined);
    
    console.log("connecting");
    var loginData = {
	"name": "PongPlayer_" + (Date.now() + Math.random()).toFixed(5)
    };

    this.tundraClient.connect("ws://" + this.serverHost + ":" + this.serverPort,
                             loginData);

};

PongApp.getThreeCamera = function() {
    return this.tundraClient.renderer.camera;
};

PongApp.getThreeMeshForEntity = function(entity) {
    console.log("eid " + entity.id);
    var meshEc = entity.component("EC_Mesh") || raise("Entity has no EC_Mesh");
    
    //asset is sometimes null now. does the scenenode biz still actually work?
    //var threeMesh = meshEc.meshAsset.mesh || raise("EC_Mesh has no THREE.Mesh");
    //apparently not. we need either proper signal or repeated calling for this..
    
    //has bit strange duplicate now but above is now just for that null check / raise thing
    //this seems possible too but the above probably better (just misses the .children thing? :
    var threeMesh = entity.mesh.getSceneNode().children[0]; //scenenode for placeable, mesh can have offset

    return threeMesh;
};

PongApp.getThreeNodeForEntity = function(entity) {
    var placeableEc =  entity.component("EC_Placeable") || raise("Entity has no EC_Placeable");
    var node = placeableEc.sceneNode || raise("EC_Placeable has no .sceneNode");
    return node;
};

PongApp.handleConnected = function() {
    // Custom app specific properties
    this.serverGameCtrl = undefined;
    this.racketSpeed = 80;
    this.ourRacket = undefined;
    this.ourPlayerArea = undefined;
    this.ourBorderLeft = undefined;
    this.playerAreaWidth = 100;
    console.log("Connected, username: " + this.tundraClient.loginProperties.name);
    
    this.tundraClient.scene.onEntityAction(
        null, this.handleEntityAction.bind(this)); // (8)
    
    this.tundraClient.onDisconnected(
        null, this.handleDisconnected.bind(this));

    // Set mesh material colors
    //any simple way for this in dev2 / webrocket core?
    //app.viewer.meshReadySig.add(
    window.setTimeout(PongApp.setAllPlayerColors, 5000);
};

PongApp.setAllPlayerColors = function() {
    //with custom comps: enitiesWithComponent("PlayerArea"); BTW: check IComponent for apps
    var dc_ents = Tundra.scene.entitiesWithComponent("DynamicComponent");
    $.each(dc_ents, function(idx, ent) {
	if (ent.name == "PlayerArea") {
	    PongApp.setPlayerColor(ent);
	}
    });
}

//for calling when the mesh component is ready, digs up the tree to get colour param:
/*
PongApp.setPlayerColor = function(meshComp, threeMesh) {
    parentScene.entityById(1)
    var parentPlayerAreaID = meshComp.parentEntity.placeable.parentRef;
    var entity = meshComp.parentEntity.parentScene.entities[parentPlayerAreaID];
    
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
*/

PongApp.setPlayerColor = function(playerAreaEntity) {
    var dc = playerAreaEntity.dynamicComponent;
    var racketEntity = playerAreaEntity.parentScene.entityById(dc.racketRef);

    var threeMesh = PongApp.getThreeMeshForEntity(racketEntity);
    threeMesh.material = new THREE.MeshLambertMaterial({
        color: dc.color
    });    
}

/*
PongApp.setRacketColor = function() {
    if (!this.ourRacket) {
        console.log("unable set racket color, ourRacket is unset");
        return;
    }
    var threeMesh = this.getThreeMeshForEntity(this.ourRacket);

    threeMesh.material = new THREE.MeshLambertMaterial({
        color: this.ourPlayerArea.dynamicComponent.color
    });
};
*/

PongApp.getThreeBall = function() {
    return this.threeScene.getObjectByName("Sphere");
};

PongApp.handleDisconnected = function() {
    // Reset entity references
    this.serverGameCtrl = undefined;
    this.ourRacket = undefined;
    this.ourPlayerArea = undefined;
    this.ourBorderLeft = undefined;
};

PongApp.disconnect = function() {
    if (this.tundraClient.isConnected())
        this.tundraClient.disconnect();
};

PongApp.gameLogicInit = function() {
    // called only once on app startup

    // TOUCH
    this.touchController = new TouchInputController();

    // CAMERA
    var SCREEN_WIDTH = window.innerWidth;
    var SCREEN_HEIGHT = window.innerHeight;
    var NEAR = -20000;
    var FAR = 20000;

    // // override camera
    this.camera = new THREE.OrthographicCamera(-SCREEN_WIDTH / 2, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, -SCREEN_HEIGHT / 2, NEAR, FAR); //(1)
    this.cameraPos = new THREE.Vector3(0, 300, 100);
    this.camera.position.copy(this.cameraPos);
    this.camera.lookAt(this.threeScene.position);

    this.tundraClient.renderer.camera = this.camera;

    // Background color
    this.threeRenderer.setClearColor( 0x000000, 0 );

    // Custom resize function because THREEx.windowResize doesn't support orthographic camera
    $(window).on('resize', function() {
        // notify the renderer of the size change
        this.threeRenderer.setSize(window.innerWidth, window.innerHeight);

        if (this.serverGameCtrl && this.camera) {
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


};

PongApp.handleFrameUpdate = function(dt) {
    var kb = this.tundraClient.input.keyboard;
    if (!this.tundraClient.isConnected())
        return;

   
    // RACKET CONTROL
    //(2)
    var inputActive = (kb.pressed.left || kb.pressed.right ||
                       kb.pressed.a || kb.pressed.d ||
                       this.touchController.swiping);
    if (this.ourRacket !== undefined &&
        this.ourPlayerArea.placeable !== undefined &&
        inputActive) {
        
        // Get racket's direction vector

        // Radian
        var rotation = (this.ourPlayerArea.placeable.transform.rot.y + 90) * (Math.PI / 180);

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
        if (kb.pressed.left || kb.pressed.a) {
            racketForward.multiplyScalar(-1);
        }

        // Set a new velocity for the entity
        // XXX either this or the entity action -- not both:
	// this.ourRacket.rigidBody.linearVelocity = racketForward; //(14)

        // Inform the server about the change
        this.ourRacket.exec(
            EntityAction.Server, "updateRacketLinearVelocity",
            [racketForward.x, racketForward.y, racketForward.z]);
        
    }

    // Players info
    if (this.serverGameCtrl) {
        this.refreshPlayersInfo(this.serverGameCtrl.dynamicComponent.playerAreas.length);
    }
};

// Set camera position and angle
PongApp.setCameraPosition = function(playerAmount) {

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
    var borderThreeObject = this.getThreeMeshForEntity(this.ourBorderLeft);
    var playerAreaThreeObject = this.getThreeNodeForEntity(this.ourPlayerArea);
    playerAreaThreeObject.updateMatrixWorld();
    borderThreeObject.updateMatrixWorld();

    var worldPos = new THREE.Vector3();
    worldPos.getPositionFromMatrix(borderThreeObject.matrixWorld);

    // Change camera position temporarily so we get a correct camera angle
    this.camera.position.set(worldPos.x, this.cameraPos.y, worldPos.z);
    this.camera.lookAt(playerAreaThreeObject.position);

    // Move camera back to the center
    this.camera.position.set(0, 10, 0);
};

PongApp.handleEntityAction = function(action) {
    console.log("got entityAction " + action.name);

    if (action.name === "sceneGenerated") {
	// The scene is (re)generated
	this.serverSceneInitialized();
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

PongApp.serverSceneInitialized = function() {
    this.hideHack();
    this.ourRacket = undefined;
    this.ourPlayerArea = undefined;

    // Find a player area that matches with the player
    this.serverGameCtrl = this.tundraClient.scene.entityByName("GameController"); //(4)

    var serverDc = this.serverGameCtrl.dynamicComponent;
    var playerCount = serverDc.playerAreas.length;
    for (var i = 0; i < playerCount; i++) {
        var entityID = parseInt(serverDc.playerAreas[i], 10);
        var entity = this.tundraClient.scene.entityById(entityID);        
        if (!entity) {
            console.log("missing playerArea: index " + i + " had entityID " + entityID);       

        } else {
            this.gotPlayerArea(entity);
        }
    }

    window.setTimeout(PongApp.setAllPlayerColors, 5000);

    if (this.ourPlayerArea !== undefined) {
        // XXX figure out when three mesh asset appears in EC_Mesh
	window.setTimeout(
            this.setCameraPosition.bind(this, playerCount), 1000);
	//window.setTimeout(
        //    this.setRacketColor.bind(this), 1000);
    }
};

PongApp.gotPlayerArea = function(areaEnt) {
    var tclient = this.tundraClient, dc = areaEnt.dynamicComponent;
    if (dc && dc.playerID === tclient.loginProperties.name) {
        console.log("my playerArea found");
        // Set player area areaEnt references
        var racketRef = dc.racketRef; //(5)
        var borderLeftRef = dc.borderLeftRef;
        this.ourRacket = tclient.scene.entityById(racketRef) || raise("missing entity"); //(6)
        this.ourBorderLeft = tclient.scene.entityById(borderLeftRef) || raise("missing entity");
        this.ourPlayerArea = areaEnt || raise("missing area entity");
    }
};

function raise(e) {
    throw e;
}

// debug helpers;
function d_cam() { return PongApp.getThreeCamera(); }
function d_ball() { return PongApp.threeScene.getObjectByName("Sphere"); }
function d_cube() { return PongApp.threeScene.getObjectByName("testcube"); }


PongApp.getRandomColor = function() {
	return '#' + '000000'.concat(Math.floor(Math.random() * 16777215).toString(16)).substr(-6);
};

PongApp.refreshPlayersInfo = function(playerAmount) {

    $("#playersInfo").empty();
    for (var i = 0; i < playerAmount; i++) {
	var entityID = parseInt(this.serverGameCtrl.dynamicComponent.playerAreas[i]);
	var entity = this.tundraClient.scene.entityById(entityID);

	if (entity) {
	    $("#playersInfo").append("<font color = " + entity.dynamicComponent.color + ">Player" + (i + 1) + ": " + entity.dynamicComponent.playerBalls + "</font><br>");
	}
    }

    //XXX HACK
    $("#playersInfo")[0].style.display = 'inline'
};

PongApp.showHelp = function() {
    this.gameDirector.setScreen(DirectorScreens.controls);
};

PongApp.nextScreen = function() {
    this.gameDirector.doNextScreen();
};

//PongApp.start();
PongApp.start("192.168.0.11");
