const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const Canvas = require('canvas')
const fs = require('fs');
const imgur = require('imgur');

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

//Some variables
var GameStarted = false;
var CurrentMove = "";
var Reverse = 1;
var Players = [];

//Some constants
const CLIENTAPI = "8d447bc32bf3805";
const IP_CHECK = true;
const MAX_PLAYERS = 10;
const MAX_CARDS = 100;
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
    if (Cookie.includes("connected=true") && !GameStarted && (Players.length < MAX_PLAYERS)) {
        res.sendFile(__dirname + '/website/game/index.html');
    } else {
        res.sendFile(__dirname + '/website/connect/index.html');
    }
});


//When someone connects
io.sockets.on('connection', socket => {
    //Save and send avatar url
    socket.on("avatar", async data => {
        var avatarBuf = await CreateAvatar(data)
        if (avatarBuf == null) { return; }
        var avatarURL = await UploadImage(CLIENTAPI, avatarBuf)

        if (!avatarURL.includes("i.imgur.com")) {
            socket.emit("alert", `There was an error uploading avatar!\n${avatarURL}`);
            return;
        }

        socket.emit("avatar", avatarURL);
    });

    //Connect player
    socket.on("join", data => {
        if (GameStarted) {
            socket.emit("alert", "Game already started!");
            return;
        }

        if (IP_CHECK) {
            for (var i = 0; i < Players.length; i++) {
                if (Players[i].ip == socket.handshake.address) {
                    socket.emit("alert", "You are already joined!");
                    return;
                }
            }
        }

        if (Players.length >= MAX_PLAYERS) {
            socket.emit("alert", `Max players ${MAX_PLAYERS}/${MAX_PLAYERS}!`);
            return;
        }

        console.log(`User connected: ${data.username}`);
        var Player = {'username': data.username, 'avatar': data.avatar, 'uid': data.uid, 'count': 0};
        io.sockets.emit("join", Player);
        Player.ip = socket.handshake.address;
        Players.push(Player);
        socket.emit("reload");
    });

    //Disconnect player
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

    //Send player list
    socket.on("players", function() {
        socket.emit("players", Players);
    });

    //Start game
    socket.on("start", function() {
        if (GameStarted) { return; }
        GameStarted = true;
        CurrentMove = Players[RandomRange(0, Players.length-1)].uid;
        io.sockets.emit("start", GenerateCard(false));
        io.sockets.emit("sound", "card_place");
        io.sockets.emit("next", CurrentMove);
    });

    //When taking +1 card
    socket.on("card", function() {
        var Cookie = socket.handshake.headers.cookie;

        if (Players[FindPlayer(Cookie)].count >= MAX_CARDS) {
            return;
        }

        socket.emit("card", GenerateCard(true));
        io.sockets.emit("sound", "card_pickup");
        ChangeCount(Cookie, 1);
    });

    //When placing card
    socket.on("drop", data => {
        io.sockets.emit("drop", data);
        io.sockets.emit("sound", "card_place");
        ChangeNext(socket.handshake.headers.cookie, data, "drop");
        ChangeCount(socket.handshake.headers.cookie, -1);
    });

    //When taking card back from stack
    socket.on("grab", data => {
        var Cookie = socket.handshake.headers.cookie;

        if (Players[FindPlayer(Cookie)].count >= MAX_CARDS) {
            return;
        }

        socket.emit("card", data);
        io.sockets.emit("grab");
        io.sockets.emit("sound", "card_pickup");
        ChangeNext(Cookie, data, "grab");
        ChangeCount(Cookie, 1);
    });
})


//============================================================================================================================================================
//Bunch of different functions================================================================================================================================
//============================================================================================================================================================


//Set title
process.title = "UNO Game";


//Reset game on exit
function exitHandler() {
    console.log("Exit");
    io.sockets.emit("reset");
    process.exit();
}


//Reset game when CTRL+C
process.on('SIGINT', exitHandler);


//Upload image to Imgur
async function UploadImage(ClientAPI, Buffer) {
    imgur.setClientId(ClientAPI);

    try {
        var json = await imgur.uploadBase64(Buffer.toString("base64"));
        return json.data.link;
    } catch(err) {
        console.log(`\n[Avatar Error] -> ${err.message.message}\n`);
        return err.message.message;
    }
}


//Create avatar
async function CreateAvatar(Buffer) {
    try {
        const frameImage = await Canvas.loadImage('website\\resources\\frame.png');
        const avatarImage = await Canvas.loadImage(Buffer);
        const canvas = Canvas.createCanvas(frameImage.width, frameImage.height);
        const ctx = canvas.getContext('2d')

        ctx.fillStyle = "black";
        ctx.fillRect(13, 13, 104, 104);
        ctx.drawImage(avatarImage, 13, 13, 104, 104);
        ctx.drawImage(frameImage, 0, 0);

        return canvas.toBuffer()
    } catch(e) {
        return null;
    }
}


//Find player index from list
function FindPlayer(Cookie) {
    var UID = GetCookie("uid", Cookie);

    for (var i = 0; i <= Players.length-1; i++) {
        if (Players[i].uid == UID) {
            return i;
        }
    }
}


//Get next user index
function FindNext(Cookie, By) {
    var Index = FindPlayer(Cookie);

    By = By * Reverse;
    Index += By;

    if (Index > Players.length-1) {
        Index = Index - Players.length;
    }

    if (Index < 0) {
        Index = Players.length + Index;
    }

    return Index;
}

//Check for cards
function CheckCardSound(Card) {
    if (Card.includes("BLOCK")) {
        io.sockets.emit("sound", "block");
        return;
    }

    if (Card.includes("PLUS_TWO")) {
        io.sockets.emit("sound", "plus_two");
        return;
    }

    if (Card.includes("COLOR_CHANGE")) {
        io.sockets.emit("sound", "color_change");
        return;
    }
}


//Change to next player
function ChangeNext(Cookie, Card, Operation) {
    if (Operation == "drop") {
        CheckCardSound(Card);
    }

    if (Card.includes("REVERSE")) {
        Reverse = Reverse * -1;
        io.sockets.emit("reverse", Reverse);
    }

    if (Players.length <= 1) { return; }

    if (Card.includes("BLOCK") && (Operation == "drop")) {
        var UID = Players[FindNext(Cookie, 1)].uid;
        io.sockets.emit("overlay", {"uid": UID, "overlay": "BLOCK"});
        var By = 2;
    } else {
        var By = 1;
    }

    if (Operation == "grab") {
        By = 0;
    }

    var Index = FindNext(Cookie, By);
    CurrentMove = Players[Index].uid;
    io.sockets.emit("next", CurrentMove); //Chnage focus to specific player
}


//Change count of player
function ChangeCount(Cookie, By) {
    var Index = FindPlayer(Cookie);
    var UID = GetCookie("uid", Cookie);
    Players[Index].count += By;

    if (By > 0) {
        io.sockets.emit("overlay", {"uid": UID, "overlay": "PLUS_CARD"});
    }

    io.sockets.emit("count", {"uid": UID, "count": Players[Index].count});
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


//Get cookie from string
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


//Get IPV4 Address
function IPV4Address() {
    var address, ifaces = require('os').networkInterfaces();
    for (var dev in ifaces) {
        ifaces[dev].filter((details) => details.family === 'IPv4' && details.internal === false ? address = details.address: undefined);
    }

    return address;
}


//Start server
server.listen(PORT, IPV4Address(), function() {
    console.log(`Listening on ${IPV4Address()}:${PORT}`);
});