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

var peerConnections = [];
var netRole = null;
var clientUpdateCallback = null;
var clientKeysPressed = null;
var id = null;
var clientID = null;
var serverID = null;
var timeOutTable = [];
var timeout = 7; // in seconds

function gotConnection(conn) {
    if (peerConnections.length > 0 && netRole === 'client') {
        console.log("Can't handle several connections in client mode");
	conn.close();
        return;
    }
    peerConnections.push(conn);
    timeOutTable.push(0);
    conn.on('data', function(data) { gotData(conn, data); });


    if(netRole === 'server'){
        // Add player
        var randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16);
        var newPeerID = peerConnections[peerConnections.length-1].peer;
        players.push(new player(newPeerID, newPeerID, randomColor));
        console.log("new player, id:" + newPeerID);

        refreshScene();
    }
}

function refreshScene(){
    // Updated scene
    playerAmount = players.length;
    ball.speed = playerAmount * 70;
    generateScene();
}


function Vec3FromArray(a) {
    var v3 = new THREE.Vector3();
    v3.copy(a);
    return v3;
}

function gotData(conn, data) {
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
            var keys = clientUpdateCallback(msg);
            conn.send(JSON.stringify({
                pressedkeys: keys,
                playerID: id,
            }))
        } else {
            console.log("update msg without handler, in " + netRole + " mod");
        }
    } else if (netRole === 'server' && msg.pressedkeys !== undefined) {
        clientKeysPressed = msg.pressedkeys;
        clientID = msg.playerID;
    }


    // Sync scene variables
    if(msg.playeramount !== undefined)
        playerAmount = msg.playeramount;
    if(msg.players !== undefined)
        players = msg.players;

}

function initNet(updateCallback, initCallBack) {
    var pjs = new Peer({
        key: peerJsApiKey
    })
    var peerid = getPeerIdFromURL();

    if (peerid !== null) {
	var conn = pjs.connect(peerid);
        gotConnection(conn);
        console.log("connecting to peer " + peerid);
        conn.on('open', function() {
            conn.send('Hello world!');
            console.log("connected to " + peerid + ", hello sent");

             initCallBack();  // it's showHelp()
        });
        netRole = 'client';
        clientUpdateCallback = updateCallback;
    } else {
        netRole = 'server';
    }

    pjs.on('open', function(myid) {
        id = myid;
        if (peerid === null) {
            var gamemsg = window.location.href + '?peer-id=' + myid
            // alert(gamemsg);
            $("#playerUrl").html(gamemsg);
            $("#urlBox").dialog("open");

            if(netRole === 'server'){
                // server is always the player 0
                var randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16);
                players[0] = new player(myid, "server", randomColor);
                playerAmount = 1;
                serverID = myid;
                console.log("server id:" + myid);
            }

            console.log(gamemsg);
             initCallBack(); // it's showHelp()
        }
    });

    pjs.on('connection', function(conn) {
        gotConnection(conn);
    });
}

function serverNetUpdate(racketPositions, ballPos, timedelta, amountPlayers, playerlist) {
    if (netRole === 'server') {
        // console.log("server net update");
        var update_msg = {
            dt: timedelta,
            racketspos: racketPositions,
            ballpos: ballPos,
            playeramount: amountPlayers,
            players: playerlist,
        };
	
	var json_msg = JSON.stringify(update_msg);
	for (var i = 0; i < peerConnections.length; i++)
        if( peerConnections[i].open == false){
            timeOutTable[i] += timedelta;


            if(timeOutTable[i] >= timeout){
                // peer disconnected
                console.log("peer disconnected");
                if(i === 0 ){
                    peerConnections.shift();
                    timeOutTable.shift();
                    } 
                else{ 
                    peerConnections.splice(i,i);
                    timeOutTable.splice(i,i);
                }
                
                players.splice(i+1,i+1);

                refreshScene();
            }
        } 
        else {
            if(timeOutTable[i] !== 0){
                timeOutTable[i] = 0;
            }
	        peerConnections[i].send(json_msg);
        }
    }
}
