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

function gotConnection(conn) {
    if (peerConnections.length > 0 && netRole === 'client') {
        console.log("Can't handle several connections in client mode");
	conn.close();
        return;
    }
    peerConnections.push(conn);
    conn.on('data', function(data) { gotData(conn, data); });
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
                pressedkeys: keys
            }))
        } else {
            console.log("update msg without handler, in " + netRole + " mod");
        }
    } else if (netRole === 'server' && msg.pressedkeys !== undefined) {
        clientKeysPressed = msg.pressedkeys;
    }
}

function initNet(updateCallback) {
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
        });
        netRole = 'client';
        clientUpdateCallback = updateCallback;
    } else {
        netRole = 'server';
    }

    pjs.on('open', function(myid) {
        if (peerid === null) {
            var gamemsg = window.location.href + '?peer-id=' + myid
            // alert(gamemsg);
            $("#playerUrl").html(gamemsg);
            $("#urlBox").dialog("open");
            console.log(gamemsg);
        }
    });

    pjs.on('connection', function(conn) {
        gotConnection(conn);
    });
}

function serverNetUpdate(racketPositions, ballPos, timedelta) {
    if (netRole === 'server') {
        // console.log("server net update");
        var update_msg = {
            dt: timedelta,
            racketspos: racketPositions,
            ballpos: ballPos,
        };
	
	var json_msg = JSON.stringify(update_msg);
	for (var i = 0; i < peerConnections.length; i++)
	    peerConnections[i].send(json_msg);
    }
}
