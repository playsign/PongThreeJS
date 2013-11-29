/* jshint -W097, -W099 */
/*
 *   @author Erno Kuusela
 */
/* global window, THREE, console, Player, getRandomColor */
"use strict";

function P2P() {

    this.peerJsApiKey = "gnyz9wskc2chaor";

    this.peerConnections = []; // used only in this file
    this.netRole = null; // used all over
    this.clientUpdateCallback = null; // used only in this file
    this.clientKeysPressed = null; // used from pong.js
    this.ThisPeerID = null; // used only in this file
    this.clientID = null; // used from pong.js
    this.serverID = null; // used from playerArea.js
    this.timeOutTable = [];
    this.clientTouch = null;
    this.timeoutByServer = 7; // in seconds
    this.timeoutByClient = 30000; // in milliseconds
    this.playerArray = [];
    this.timeoutDebug = false; // first connection will fake-timeout to exercise code

}

P2P.prototype.getPeerIdFromURL = function() {
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

P2P.prototype.gotConnection = function(conn) {
    if (conn !== undefined) {
        conn.scope = this;
    }

    if (this.peerConnections.length > 0 && this.netRole === 'client') {
        console.log("Can't handle several connections in client mode");
        conn.close();
        return;
    }
    this.peerConnections.push(conn);
    this.timeOutTable.push(0);
    conn.on('data', function(data) {
        this.scope.gotData(conn, data);
    });


    if (this.netRole === 'server') {
        // Add player
        var randomColor = getRandomColor();
        var newPeerID = this.peerConnections[this.peerConnections.length - 1].peer;
        this.playerArray.push(new Player(newPeerID, newPeerID, randomColor));
        console.log("new player, id:" + newPeerID);

        this.refreshScene();
    }
}

P2P.prototype.refreshScene = function() {
    // Updated scene
    sceneCtrl.playerAmount = this.playerArray.length;
    sceneCtrl.ball.speed = sceneCtrl.playerAmount * 70;
    sceneCtrl.generateScene();
}


P2P.prototype.Vec3FromArray = function(a) {
    var v3 = new THREE.Vector3();
    v3.copy(a);
    return v3;
}

P2P.prototype.gotData = function(conn, data) {
    var msg;

    try {
        msg = JSON.parse(data);
    } catch (err) {
        console.log("not JSON: " + data);
        return;
    }
    if (this.netRole === 'client' && msg.ballpos !== undefined) {
        msg.ballpos = this.Vec3FromArray(msg.ballpos);
        msg.racketspos = msg.racketspos.map(function(arr) {
            return p2pCtrl.Vec3FromArray(arr);
        });
        if (this.clientUpdateCallback) {
            var keys = this.clientUpdateCallback(msg).keyboard;
            var newSwipe = this.clientUpdateCallback(msg).touch;
            var peerID = this.ThisPeerID;
            console.log("newSwipe: "+newSwipe);
            conn.send(JSON.stringify({
                pressedkeys: keys,
                swipe: newSwipe,
                playerID: peerID,
            }))
        } else {
            console.log("update msg without handler, in " + this.netRole + " mod");
        }
    } else if (this.netRole === 'server' && msg.pressedkeys !== undefined) {
        this.clientKeysPressed = msg.pressedkeys;
        this.clientTouch = msg.swipe;
        this.clientID = msg.playerID;
    } else if (this.netRole === 'server') {
        console.log("undefined keys in net msg");
    }


    // Sync scene variables
    if (msg.playeramount !== undefined)
        sceneCtrl.playerAmount = msg.playeramount;
    if (msg.players !== undefined)
        this.playerArray = msg.players;

}

P2P.prototype.removePeerConnection = function(conn) {
    for (var i = 0; i < this.peerConnections.length; i++) {
        if (conn === this.peerConnections[i]) {
            this.peerConnections.splice(i, 1);
            this.timeOutTable.splice(i, 1);
        }
    }
}


P2P.prototype.makePeer = function() {
    return new Peer({
        key: this.peerJsApiKey
    })
}

P2P.prototype.initNet = function(updateCallback) {
    var peerid = this.getPeerIdFromURL();

    if (peerid !== null) {
        this.initClient(updateCallback, peerid);
    } else {
        this.initServer(updateCallback);
    }
}

var connectionRetries = 0;

P2P.prototype.attemptServerConnection = function(peerid) {
    if ((typeof peerid) !== "string")
        throw ("peerid must be string! got this: " + peerid);
    var pjs = this.makePeer();
    pjs.scope = this;
    pjs.on('open', function(myid) {
        this.scope.ThisPeerID = myid;
    });
    var conn = pjs.connect(peerid);
    conn.on("open", function() {
        console.log("connection estabilished to server");
        showHelp();
    });
    conn.on("error", function() {
        console.log("connection error to server");
    });
    this.gotConnection(conn);
    console.log("connecting to peer " + peerid);

    var connectionTimeout = function() {
        var connectionOk = undefined;
        var connectionFailureFaked = undefined;
        if (this.timeoutDebug && conn.open === true && connectionRetries === 0) {
            // fake timeout on first attempt
            connectionOk = false;
            connectionFailureFaked = true;
        } else {
            connectionOk = conn.open;
            connectionFailureFaked = false;
        }

        if (connectionOk === false && this.netRole !== null) {
            this.removePeerConnection(conn);
            conn.close();
            pjs.disconnect();
            console.log("server connection timed out - faked=" + connectionFailureFaked);
            if (connectionRetries++ < 10) {
                console.log("retrying connetion, attempt #" + connectionRetries);
                this.attemptServerConnection(peerid);
            } else {
                console.log("giving up");
                // can put callback here for connection failure?
            }
        }
    }
    window.setTimeout(connectionTimeout, this.timeoutByClient /*ms*/ );
    return conn;
}

P2P.prototype.initClient = function(updateCallback, peerid) {
    var conn = this.attemptServerConnection(peerid)
    this.netRole = 'client';
    this.clientUpdateCallback = updateCallback;
    // console.log("client update callback registered");
}

P2P.prototype.initServer = function(updateCallback) {
    this.netRole = 'server';
    var pjs = this.makePeer();
    pjs.scope = this;
    pjs.on('open', function(myid) {
        this.scope.ThisPeerID = myid;
    });
    pjs.on('open', function(myid) {
        var gamemsg = window.location.href + '?peer-id=' + myid
        // alert(gamemsg);
        $("#playerUrl").html(gamemsg);
        $("#urlBox").dialog("open");

        if (this.scope.netRole === 'server') {
            // server is always the player 0
            var randomColor = getRandomColor();
            this.scope.playerArray[0] = new Player(myid, "server", randomColor);
            sceneCtrl.playerAmount = 1;
            this.scope.serverID = myid;
            console.log("server id:" + myid);
        }

        console.log(gamemsg);
        showHelp();
    });

    pjs.on('connection', function(conn) {
        this.scope.gotConnection(conn);
    });
}


P2P.prototype.serverNetUpdate = function(racketPositions, ballPos, timedelta, amountPlayers) {
    if (this.netRole === 'server') {
        // console.log("server net update");
        var update_msg = {
            dt: timedelta,
            racketspos: racketPositions,
            ballpos: ballPos,
            playeramount: amountPlayers,
            players: this.playerArray,
        };

        var json_msg = JSON.stringify(update_msg);
        for (var i = 0; i < this.peerConnections.length; i++)
            if (this.peerConnections[i].open === false) {
                this.timeOutTable[i] += timedelta;


                if (this.timeOutTable[i] >= this.timeoutByServer) {
                    // peer disconnected
                    console.log("peer disconnected");
                    this.peerConnections.splice(i, 1);
                    this.timeOutTable.splice(i, 1);

                    this.playerArray.splice(i + 1, 1);

                    this.refreshScene();
                }
            } else {
                if (this.timeOutTable[i] !== 0) {
                    this.timeOutTable[i] = 0;
                }
                var conn = this.peerConnections[i];
                try {
                    conn.send(json_msg);
                } catch (err) {
                    console.log("Send to peer connection " + i + " failed: " + err + " - removing that connection");
                    this.removePeerConnection(conn);
                    try {
                        conn.close();
                    } catch (e) {}
                }
            }
    }
}