/* jshint -W097, -W099 */
/* global window, THREE, console, Player, getRandomColor */
"use strict";

var peerJsApiKey = "gnyz9wskc2chaor";

function getPeerIdFromURL() {
    if (window.location.search) {
        var params = window.location.search.substring(1).split('&');
        for (var i = 0; i < params.length; ++i) {
            if (params[i].match('^peer-id')) {
                return params[i].split('=')[1];
            }
        }
    }
    return null;
}

var peerConnections = []; // used only in this file
var netRole = null; // used all over
var clientUpdateCallback = null; // used only in this file
var clientKeysPressed = null; // used from pong.js
var ThisPeerID = null; // used only in this file
var clientID = null; // used from pong.js
var serverID = null; // used from playerArea.js
var timeOutTable = []; 
var clientTouch = null;
var timeoutByServer = 7; // in seconds
var timeoutByClient = 30000; // in milliseconds
var playerArray = [];
var playerAmount = null; // used in pong.js
var timeoutDebug = false; // first connection will fake-timeout to exercise code

function gotConnection(conn) {
    if (peerConnections.length > 0 && netRole === 'client') {
        console.log("Can't handle several connections in client mode");
	conn.close();
        return;
    }
    peerConnections.push(conn);
    timeOutTable.push(0);
    conn.on('data', function(data) { gotData(conn, data); });


    if (netRole === 'server') {
        // Add player
        var randomColor = getRandomColor();
        var newPeerID = peerConnections[peerConnections.length-1].peer;
        playerArray.push(new Player(newPeerID, newPeerID, randomColor));
        console.log("new player, id:" + newPeerID);

        refreshScene();
    }
}

function refreshScene() {
    // Updated scene
    playerAmount = playerArray.length;
    ball.speed = playerAmount * 70;
    generateScene();
}


function Vec3FromArray(a) {
    var v3 = new THREE.Vector3();
    v3.copy(a);
    return v3;
}

function gotData(conn, data) {
    var msg;
    try {
        msg = JSON.parse(data);
    } catch (err) {
        console.log("not JSON: " + data);
        return;
    }
    if (netRole === 'client' && msg.ballpos !== undefined) {
        msg.ballpos = Vec3FromArray(msg.ballpos);
        msg.racketspos = msg.racketspos.map(function(arr) {
            return Vec3FromArray(arr);
        });
        if (clientUpdateCallback) {
            var keys = clientUpdateCallback(msg).keyboard;
            var newSwipe = clientUpdateCallback(msg).touch;
            conn.send(JSON.stringify({
                pressedkeys: keys,
                swipe: newSwipe,
                playerID: ThisPeerID,
            }))
        } else {
            console.log("update msg without handler, in " + netRole + " mod");
        }
    } else if (netRole === 'server' && msg.pressedkeys !== undefined) {
        clientKeysPressed = msg.pressedkeys;
        clientTouch = msg.swipe;
        clientID = msg.playerID;
    } else if (netRole === 'server') {
	console.log("undefined keys in net msg");
    }


    // Sync scene variables
    if (msg.playeramount !== undefined)
        playerAmount = msg.playeramount;
    if (msg.players !== undefined)
        playerArray = msg.players;

}

function removePeerConnection(conn) {
    for (var i = 0; i < peerConnections.length; i++) {
	if (conn === peerConnections[i]) {
	    peerConnections.splice(i, 1);
	    timeOutTable.splice(i, 1);
	}
    }
}


function makePeer() {
    return new Peer({key: peerJsApiKey})
}

function initNet(updateCallback) {
    var peerid = getPeerIdFromURL();
    
    if (peerid !== null) {
	initClient(updateCallback, peerid);
    } else {
	initServer(updateCallback);
    } 
}

var connectionRetries = 0;

function attemptServerConnection(peerid) {
    if ((typeof peerid) !== "string")
	throw("peerid must be string! got this: " + peerid);
    var pjs = makePeer();
    pjs.on('open', function(myid) { ThisPeerID = myid; });
    var conn = pjs.connect(peerid);
    conn.on("open", function () {
	console.log("connection estabilished to server");
	showHelp();
    });
    conn.on("error", function () {
	console.log("connection error to server");
    });
    gotConnection(conn);
    console.log("connecting to peer " + peerid);

    var connectionTimeout = function() {
	var connectionOk = undefined;
	var connectionFailureFaked = undefined;
	if (timeoutDebug && conn.open === true && connectionRetries === 0) {
	    // fake timeout on first attempt
	    connectionOk = false;
	    connectionFailureFaked = true;
	} else {
	    connectionOk = conn.open;
	    connectionFailureFaked = false;
	}

	if (connectionOk === false && netRole !== null) {
	    removePeerConnection(conn);
	    conn.close();
	    pjs.disconnect();
	    console.log("server connection timed out - faked=" + connectionFailureFaked);
	    if (connectionRetries++ < 10) {
		console.log("retrying connetion, attempt #" + connectionRetries);
		attemptServerConnection(peerid);
	    } else {
		console.log("giving up");
		// can put callback here for connection failure?
	    }
	}
    }
    window.setTimeout(connectionTimeout, timeoutByClient /*ms*/);
    return conn;
}

function initClient(updateCallback, peerid) {
    var conn = attemptServerConnection(peerid)
    netRole = 'client';
    clientUpdateCallback = updateCallback;
    // console.log("client update callback registered");
}

function initServer(updateCallback) {
    netRole = 'server';
    var pjs = makePeer();
    pjs.on('open', function(myid) { ThisPeerID = myid; });
    pjs.on('open', function(myid) {
        var gamemsg = window.location.href + '?peer-id=' + myid
        // alert(gamemsg);
        $("#playerUrl").html(gamemsg);
        $("#urlBox").dialog("open");

        if (netRole === 'server') {
            // server is always the player 0
            var randomColor = getRandomColor();
            playerArray[0] = new Player(myid, "server", randomColor);
            playerAmount = 1;
            serverID = myid;
            console.log("server id:" + myid);
        }

        console.log(gamemsg);
        showHelp();
    });

    pjs.on('connection', function(conn) {
        gotConnection(conn);
    });
}


function serverNetUpdate(racketPositions, ballPos, timedelta, amountPlayers) {
    if (netRole === 'server') {
        // console.log("server net update");
        var update_msg = {
            dt: timedelta,
            racketspos: racketPositions,
            ballpos: ballPos,
            playeramount: amountPlayers,
            players: playerArray,
        };
	
	var json_msg = JSON.stringify(update_msg);
	for (var i = 0; i < peerConnections.length; i++)
            if (peerConnections[i].open === false) {
		timeOutTable[i] += timedelta;


		if (timeOutTable[i] >= timeoutByServer) {
                    // peer disconnected
                    console.log("peer disconnected");
		    peerConnections.splice(i, 1);
		    timeOutTable.splice(i, 1);
                    
                    playerArray.splice(i+1, 1);

                    refreshScene();
		}
            } 
        else {
            if (timeOutTable[i] !== 0) {
                timeOutTable[i] = 0;
            }
	    var conn = peerConnections[i];
	    try {
		conn.send(json_msg);
	    } catch (err) {
		console.log("Send to peer connection " + i + " failed: " + err + " - removing that connection");
		removePeerConnection(conn);
		try { conn.close(); } catch (e) { }
	    }
        }
    }
}
