const http = require('http');
const express = require('express');
const socketio = require('socket.io');
var fs = require('fs');

const Cards = {
    standart: [
        "BLUE_ZERO",
        "BLUE_ONE",
        "BLUE_TWO",
        "BLUE_THREE",
        "BLUE_FOUR",
        "BLUE_FIVE",
        "BLUE_SIX",
        "BLUE_SEVEN",
        "BLUE_EIGHT",
        "BLUE_NINE",
        
        "GREEN_ZERO",
        "GREEN_ONE",
        "GREEN_TWO",
        "GREEN_THREE",
        "GREEN_FOUR",
        "GREEN_FIVE",
        "GREEN_SIX",
        "GREEN_SEVEN",
        "GREEN_EIGHT",
        "GREEN_NINE",
        
        "RED_ZERO",
        "RED_ONE",
        "RED_TWO",
        "RED_THREE",
        "RED_FOUR",
        "RED_FIVE",
        "RED_SIX",
        "RED_SEVEN",
        "RED_EIGHT",
        "RED_NINE",
        
        "YELLOW_ZERO",
        "YELLOW_NINE",
        "YELLOW_ONE",
        "YELLOW_TWO",
        "YELLOW_THREE",
        "YELLOW_FOUR",
        "YELLOW_FIVE",
        "YELLOW_SIX",
        "YELLOW_SEVEN",
        "YELLOW_EIGHT",
    ],
    special: [
        "BLUE_REVERSE",
        "BLUE_BLOCK",
        "BLUE_PLUS_TWO",
        
        "GREEN_REVERSE",
        "GREEN_BLOCK",
        "GREEN_PLUS_TWO",
        
        "RED_REVERSE",
        "RED_BLOCK",
        "RED_PLUS_TWO",
        
        "YELLOW_REVERSE",
        "YELLOW_BLOCK",
        "YELLOW_PLUS_TWO",
        
        "COLOR_CHANGE",
        "PLUS_FOUR",
    ],
    cover: "UNO_CARD"
}

//Game settings
const Game = {
    started: false,
}

//List of players
const Players = [];

//Some constants and variables
const PORT = 80;


//Launch website
const app = express();
app.use(express.static("website", {index: "index.html"}));
const server = http.createServer(app);
const io = socketio(server);


//When someone visit webpage
app.get('/', function(req, res) {
    //Log some data
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    var Cookie = req.headers.cookie || "";
    console.log(`\nNew connection from ${ip}`);
    console.log(`Cookie: ${Cookie}`);
    
    //Load needed page
    if (Cookie.includes("connected=true") && !Game.started) {
        res.sendFile(__dirname + '/website/game/index.html');
    } else {
        res.sendFile(__dirname + '/website/connect/index.html');
    }
});


//When someone connects
io.sockets.on('connection', socket => {
    socket.on("avatar", data => {
        var avatarURL = "avatars\\" + MakeID(32) + ".png";
        var image = data.replace(/^data:image\/\w+;base64,/, "");
        var buffer = new Buffer(image, 'base64');
        if (!fs.existsSync("website\\avatars")) { fs.mkdirSync("website\\avatars"); }
        fs.writeFileSync("website\\" + avatarURL, buffer);
        socket.emit("avatar", avatarURL);
    });

    socket.on("join", data => {
        if (Game.started) {
            socket.emit("started");
            return;
        }

        console.log(`User connected: ${data.username}`);
        var Player = {'username': data.username, 'avatar': data.avatar, 'uid': data.uid, 'count': 0};
        io.sockets.emit("join", Player);
        Players.push(Player);
        socket.emit("reload");
    });

    socket.on("disconnect", function() {
        var Cookie = socket.handshake.headers.cookie || "";
        var Username = GetCookie("username", Cookie);
        var UID = GetCookie("uid", Cookie);
        if (Username == "") { Username = socket.id; }

        if (!Cookie.includes("connected=true")) {
            return;
        }

        for (var i = 0; i <= Players.length-1; i++) {
            if (Players[i].uid == UID) {
                Players.splice(i, 1);
                break;
            }
        }

        io.sockets.emit("left", UID);
        console.log(`\n${Username} disconnect.`);
     });

    socket.on("players", function() {
        socket.emit("players", Players);
    });

    socket.on("start", function() {
        if (Game.started) { return; }
        Game.started = true;
        io.sockets.emit("start", GenerateCard(false));
    });

    socket.on("card", function() {
        socket.emit("card", GenerateCard(true));
        ChangeCount(socket.handshake.headers.cookie, 1);
    });

    socket.on("drop", data => {
        io.sockets.emit("drop", data);
        ChangeCount(socket.handshake.headers.cookie, -1);
    });

    socket.on("grab", data => {
        socket.emit("card", data);
        io.sockets.emit("grab");
        ChangeCount(socket.handshake.headers.cookie, 1);
    });
})


//============================================================================================================================================================
//Bunch of different functions================================================================================================================================
//============================================================================================================================================================


//Set title
process.title = "UNO Game";


//Change count of player
function ChangeCount(Cookie, By) {
    var UID = GetCookie("uid", Cookie);

    for (var i = 0; i <= Players.length-1; i++) {
        if (Players[i].uid == UID) {
            Players[i].count += By;
            io.sockets.emit("count", {"uid": UID, "count": Players[i].count});
        }
    }
}


//Random text generator
function MakeID(length) {
    var Result = '';
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (var i = 0; i < length; i++) {
        Result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return Result;
}


//Get IPV4 Address
function IPV4Address() {
    return "127.0.0.1";

    var address, ifaces = require('os').networkInterfaces();
    for (var dev in ifaces) {
        ifaces[dev].filter((details) => details.family === 'IPv4' && details.internal === false ? address = details.address: undefined);
    }

    return address;
}


//Get coockie from string
function GetCookie(Name, Cookie) {
    var search = Name + "=";
    var ca = Cookie.split(";");

    for(var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == " ") {
        c = c.substring(1);
      }
      if (c.indexOf(search) == 0) {
        return c.substring(search.length, c.length);
      }
    }

    return "";
}


//Generate random number between
function RandomRange(min, max){
    return Math.floor(Math.random()*(max-min+1)+min);
}


//Choose random card
function GenerateCard(UseSpecial) {
    if (UseSpecial && (RandomRange(1, 2) == 2)) {
        return Cards.special[RandomRange(0, Cards.special.length-1)];
    }

    return Cards.standart[RandomRange(0, Cards.standart.length-1)];
}


//Start server
server.listen(PORT, IPV4Address(), function() {
    console.log(`Listening on ${IPV4Address()}:${PORT}`);
});