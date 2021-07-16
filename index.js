const config = require("./config");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const Canvas = require("canvas")
const fs = require("fs");
const { v4: uuidv4 } = require('uuid');

//Variable to store all rooms
var rooms = {};


//Launch website
const app = express();
app.use(express.static("website", {index: "index.html"}));
const server = http.createServer(app);
const io = socketio(server);


//When someone visit webpage
app.get("/", function(req, res) {
    //Log some data
    var ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    var Cookie = req.headers.cookie || "";
    console.log(`\nNew connection from ${ip}`);
    console.log(`Cookie: ${Cookie}`);
    
    //Send website page
    res.sendFile(__dirname + "/website/index.html");
});


//When someone connects
io.sockets.on("connection", socket => {
    //Generate uid for socket
    socket.uid = uuidv4().replace(/-/g, "");


    //Save and send avatar url
    socket.on("avatar", async data => {
        var uid = uuidv4().replace(/-/g, "");
        var avatarCode = await CreateAvatar(data, uid);

        if (avatarCode != null) {
            socket.emit("avatar", {code: 200, avatarCode: avatarCode});
        } else {
            socket.emit("avatar", {code: 1001, message: config.error_codes[1001]});
        }
    });


    //Join player to room
    socket.on("join", data => {
        //Check if socket is already connect to room
        if (socket.room) { return; }

        //Check if username is normal
        if (!data.username || !data.username.match(/^.{2,24}$/)) {
            socket.emit("join", {code: 1004, message: config.error_codes[1004]});
            return;
        }

        //Check if invite is normal
        if (!data.invite || !data.invite.match(/^.[0-9a-z]{7,7}$/)) {
            socket.emit("join", {code: 1005, message: config.error_codes[1005]});
            return;
        }

        //Get room
        var room = rooms[data.invite];

        //Create room if doesnt exist
        if (!room) {
            var room = CreateRoom(socket.uid);
            rooms[data.invite] = room;
        }

        //Check if game started
        if (room.started) {
            socket.emit("join", {code: 1002, message: config.error_codes[1002]});
            return;
        }

        //Check if max players
        if (Object.keys(room.players).length >= room.max_players) {
            socket.emit("join", {code: 1003, message: config.error_codes[1003]});
            return;
        }

        //Log who joined
        console.log(`${data.username}(${socket.uid}) joined room: ${data.invite}`);

        //Check if avatar exists
        if (!data.avatar || !fs.existsSync(`./website/avatars/${data.avatar}.png`)) {
            data.avatar = 'resources/defaultAvatar.png';
        } else {
            data.avatar = `avatars/${data.avatar}.png`;
        }

        //Create player and fake id, just to use it in html
        var player = {username: data.username, avatar: data.avatar, id: socket.uid, count: 0};
        rooms[data.invite].players[socket.uid] = player;

        //Add variables to player socket
        socket.room = data.invite;

        //Send new player info to already conected players
        io.to(data.invite).emit("new_player", player);

        //Join player to same room
        socket.join(data.invite);

        //Send info of room to new player
        socket.emit("join", {code: 200, players: rooms[data.invite].players, owner: room.owner, my_id: socket.uid});
    });


    //Disconnect player
    socket.on("disconnect", function() {
        //Remove player from rooms
        if (socket.room && socket.uid) {
            //Clear room from socket, so it can join another room
            var socket_room = socket.room;
            var room = rooms[socket_room];
            delete socket.room;

            if (!room) { return; }

            //Get players list
            var players = Object.keys(room.players);
            var info = {id: socket.uid}

            //If left player is not last and he was owner then select new owner
            if ((players.length-1 != 0) && room.owner == socket.uid) {
                room.owner = players[1]; //Change owner
                info.new_owner = players[1];
            }

            //Set new playing if current left, and clear stack
            if ((players.length-1 != 0) && socket.uid == room.current_move) {
                room.stack = 0;
                room.current_move = NextPlayer(room, socket.uid, 1);
                info.current_move = room.current_move;
            }

            //Remove player and log that player left
            delete room.players[socket.uid];
            console.log(`\n${socket.uid} disconnect.`);

            //If last player left delete room
            if (players.length-1 != 0) {
                if (!room.winner) { io.to(socket_room).emit("left", info); }
            } else {
                delete rooms[socket_room];
            }
        }
     });


    //Start game
    socket.on("start", function() {
        if (!socket.room || !socket.uid) {
            return;
        }

        //Get room
        var room = rooms[socket.room];

        if (!room || room.started || room.owner != socket.uid || (Object.keys(room.players).length == 0)) {
            return;
        }

        //Get list of players uid
        var players = Object.keys(room.players);

        //Start game and set random player as first
        room.started = true;
        room.current_move = players[RandomRange(0, players.length-1)]; //Select random player

        //Generate first card
        room.current_card = GenerateCard(false);

        //Get clients list
        const clients = io.sockets.adapter.rooms.get(socket.room);

        //Generate cards for players
        for (const cid of clients) {
            //get client
            const clientSocket = io.sockets.sockets.get(cid);
            var cards = room.cards[clientSocket.uid] = {};
            room.players[clientSocket.uid].count = room.start_cards;

            //Generate cards
            for (var i = 0; i < room.start_cards; i++) {
                cards[uuidv4().replace(/-/g, '')] = GenerateCard(true);
            }

            //Send info
            clientSocket.emit("start", {code: 200, cards: cards, current_card: room.current_card, current_move: room.current_move});
       }
    });


    //When placing card
    socket.on("place_card", data => {
        if (!socket.room || !socket.uid) { return; }

        //Get current room
        var room = rooms[socket.room];
        if (!room || !room.started || room.next_move || room.current_move != socket.uid) { return; }

        //Get current card
        var card = room.cards[socket.uid][data.id];
        if (!card) { return; }

        //Store information here
        var next_by = 1;
        var pickcolor = false;

        //console.log("current_card:");
        //console.log(room.current_card);
        //console.log("card:");
        //console.log(card);
        //console.log("\n");

        switch (card.type) {
            case "REVERSE": //Can put on same color or same type, reverse direction, can be put after stack was taken
                if (room.stack > 0 || (card.color != room.current_card.color && card.type != room.current_card.type)) { return; }
                room.direction *= -1;
                break;
            case "BLOCK": //Can put on same color or same type, just skip by 1 more, can be put after stack was taken
                if (room.stack > 0 || (card.color != room.current_card.color && card.type != room.current_card.type)) { return; }
                next_by += 1;
                break;
            case "PLUS_TWO": //Cannot put PLUS_TWO on PLUS_FOUR, but can put it on anything else with same color, can be put after stack was taken
                if ((room.stack > 0 && room.current_card.type == "PLUS_FOUR") || (card.color != room.current_card.color && card.type != room.current_card.type)) { return; }
                room.stack += 2;
                break;
            case "PLUS_FOUR": //PLUS_FOUR can be aplied to everything there is no limits, so no need to check color or type
                room.stack += 4;
                pickcolor = true;
                break;
            case "COLOR_CHANGE": //Cannot be put on PLUS_FOUR and PLUS_TWO, but can put it on anything else with different color, can be put after stack was taken
                if ((room.stack > 0 && (room.current_card.type == "PLUS_FOUR" || room.current_card.type == "PLUS_TWO"))) { return; }
                pickcolor = true;
                break;
            default:
                if (room.stack > 0 || (card.color != room.current_card.color && card.type != room.current_card.type)) { return; }
        }

        /*//Handle cards with same color and type
        if (card.color == room.current_card.color || card.type == room.current_card.type) {
            switch (card.type) {
                case "REVERSE": //No need to check for color or same type, just change dierction
                    if (room.stack > 0) { return; }
                    room.direction *= -1;
                    break;
                case "BLOCK": //No need to check for color or same type, just skip by 1 more
                    if (room.stack > 0) { return; }
                    next_by += 1;
                    break;
                case "PLUS_TWO": //Cannot put PLUS_TWO on PLUS_FOUR, but can put it on anything else with same color, can be put after stack was taken
                    if (room.stack > 0 && room.current_card.type == "PLUS_FOUR") { return; }
                    room.stack += 2;
                    break;
                default: if (room.stack > 0) { return; }
            }
        } else { //Handle cards with different color
            switch (card.type) {
                case "PLUS_FOUR": //PLUS_FOUR can be aplied to everything there is no limits, so no need to check
                    room.stack += 4;
                    pickcolor = true;
                    break;
                case "COLOR_CHANGE": //Cannot be put on PLUS_FOUR and PLUS_TWO, but can put it on anything else with different color, can be put after stack was taken
                    if (room.stack > 0 && (room.current_card.type == "PLUS_FOUR" || room.current_card.type == "PLUS_TWO")) { return; }
                    pickcolor = true;
                    break;
                default: return;
            }
        }*/

        room.current_card = card; //Update current card
        delete room.cards[socket.uid][data.id]; //Remove card from player
        delete room.choose; //Clear choose if player was choosing
        var player = room.players[socket.uid]; //Get player
        player.count -= 1; //Decrease players card count

        if (pickcolor) {
            room.next_move = NextPlayer(room, socket.uid, next_by);
        } else {
            room.current_move = NextPlayer(room, socket.uid, next_by);
        }

        var data = {
            new_card: card, //new placed card
            remove_card_id: data.id, //used to remove card from player
            direction: room.direction, //What, direction normal or reverse
            next_move: room.current_move, //Next who will play
            pickcolor: pickcolor, //Should player pick color
            uno: (player.count == 1), //If it should be uno
            count: {
                uid: socket.uid, //Who's count changed
                count: player.count, //What is new count
            },
        }

        //Check if player won
        if (room.players[socket.uid].count == 0) {
            room.current_move = "";
            room.winner = socket.uid;
            data.winner = socket.uid;
            data.timeout = config.NEXT_GAME_TIMEOUT;

            ResetRoom(socket.room);
        }

        //Check if and who was blocked
        if (next_by >= 2) {
            data.blocked = NextPlayer(room, socket.uid, 1);
        }

        //Send data
        io.sockets.to(socket.room).emit("place_card", data);
    });


    //When changing color
    socket.on("change_color", function(data) {
        if (!socket.room || !socket.uid) { return; }

        //Get current room
        var room = rooms[socket.room];
        if (!room || !room.started || room.current_move != socket.uid) { return; }

        //Check if current card is PLUS_FOUR or COLOR_CHANGE
        if (room.current_card.type != "PLUS_FOUR" && room.current_card.type != "COLOR_CHANGE") {
            return;
        }

        //Check sent information
        if (!config.colors.includes(data.color)) {
            return;
        }

        room.current_card = {color: data.color, type: room.current_card.type} //Update card
        room.current_move = room.next_move; //Set next move
        delete room.next_move;

        var data = {
            type: room.current_card.type, //What type of card
            color: data.color, //To what color changed
            next_move: room.current_move, //Who is playing next
        }

        io.sockets.to(socket.room).emit("change_color", data);
    });


    //When taking +1 card
    socket.on("take_card", function() {
        if (!socket.room || !socket.uid) { return; }

        //Get current room
        var room = rooms[socket.room];
        if (!room || !room.started || room.next_move || room.choose || room.current_move != socket.uid) { return; }

        //Get player
        var player = room.players[socket.uid];
        if (!player) { return; }

        //Get cards
        var player_cards = room.cards[socket.uid];
        if (!player_cards) { return; }

        //Check if player has cards to play, and if he is just skiping his turn
        var can_play_card_before = false;
        for (const [key, value] of Object.entries(player_cards)) {
            if (canPlayCard(room, value)) {
                var can_play_card_before = true;
                break;
            };
        }

        var take_count = (room.stack > 0) ? room.stack : 1;
        var can_play_card_after = false;  //Check if player got needed card to play
        var cards = {}

        while (take_count != 0 && player.count < room.max_cards) {
            var uid = uuidv4().replace(/-/g, ''); //Generate uid
            var card = GenerateCard(true) //Generate card
            if (!can_play_card_after) { can_play_card_after = canPlayCard(room, card); }

            cards[uid] = card; //This will be sent to player
            player_cards[uid] = card; //Save also on server side
            player.count += 1; //Increase player count
            take_count -= 1; //Decrease amount to take
        }

        //If player was taking stack or had card to play skip choose screen
        if (room.stack > 0 || can_play_card_before) {
            can_play_card_after = false;
            room.current_move = NextPlayer(room, socket.uid, 1);
        } else {
            room.choose = can_play_card_after;
            room.current_move = socket.uid;
        }

        room.stack = 0;

        socket.emit("take_card", {cards: cards, choose: can_play_card_after});
        io.sockets.to(socket.room).emit("take_card", {next_move: room.current_move, count: {do_update: (Object.keys(cards).length > 0), uid: socket.uid, count: player.count}});
    });


    //When changing color
    socket.on("save_card", function(data) {
        if (!socket.room || !socket.uid) { return; }

        //Get current room
        var room = rooms[socket.room];
        if (!room || !room.started || room.current_move != socket.uid) { return; }

        //Check if specific card exists
        var card = room.cards[socket.uid][data.id];
        if (!card) { return; }

        //Set next player and clear choose
        room.current_move = NextPlayer(room, socket.uid, 1);
        delete room.choose;

        io.sockets.to(socket.room).emit("take_card", {next_move: room.current_move});
    });
})


//============================================================================================================================================================
//Bunch of different functions================================================================================================================================
//============================================================================================================================================================


//Set title
process.title = "UNO Game";


//On exit close website
process.on('SIGINT', function() {
    console.log("Exit");
    io.sockets.emit("closed", "Server has been closed.");
    process.exit();
});


//Wait function
async function Wait(milleseconds) {
	return new Promise(resolve => setTimeout(resolve, milleseconds))
}


//Reset room
async function ResetRoom(room_id) {
    await Wait(config.NEXT_GAME_TIMEOUT*1000 + 1500); //This amount before winner screen appears (500) + wait little more (500)

    //Get room
    var room = rooms[room_id];
    if (!room) { return; }

    //Get players
    var players = Object.keys(room.players);
    if (players.length == 0) { return; } //Not quite needed since if last player leaves room is deleted, but I still added it here

    //Recreate room
    var new_room = CreateRoom(room.owner);
    new_room.players = room.players;
    new_room.started = true;
    new_room.current_move = players[RandomRange(0, players.length-1)]; //Select random player
    new_room.current_card = GenerateCard(false); //Generate first card

    //Get clients list
    const clients = io.sockets.adapter.rooms.get(room_id);

    //Generate cards for players
    for (const cid of clients) {
        //Get client
        const clientSocket = io.sockets.sockets.get(cid);
        var cards = new_room.cards[clientSocket.uid] = {};
        new_room.players[clientSocket.uid].count = new_room.start_cards;

        //Generate cards
        for (var i = 0; i < new_room.start_cards; i++) {
            cards[uuidv4().replace(/-/g, '')] = GenerateCard(true);
        }

        //Send info
        clientSocket.emit("join", {code: 200, players: new_room.players, owner: new_room.owner});
        clientSocket.emit("start", {code: 200, cards: cards, current_card: new_room.current_card, current_move: new_room.current_move});
   }

   //Assign new room
   rooms[room_id] = new_room;
}


//Create avatar
async function CreateAvatar(buffer, uid) {
    try {
        const frameImage = await Canvas.loadImage("website/resources/frame.png");
        const avatarImage = await Canvas.loadImage(buffer);
        const canvas = Canvas.createCanvas(frameImage.width, frameImage.height);
        const ctx = canvas.getContext("2d")

        ctx.fillStyle = "black";
        ctx.fillRect(13, 13, 104, 104);
        ctx.drawImage(avatarImage, 13, 13, 104, 104);
        ctx.drawImage(frameImage, 0, 0);

        fs.writeFileSync(`./website/avatars/${uid}.png`, canvas.toBuffer())
        return uid;
    } catch(e) {
        return null;
    }
}


//Create room for player (later, maybe include settings - maxplayers, maxcards, startcrads, timer, canstack, canjumpin)
function CreateRoom(owner) {
    return {
        owner: owner,
        direction: config.DIRECTION_FORWARD,
        start_cards: config.START_CARDS,
        max_players: config.MAX_PLAYERS,
        max_cards: config.MAX_CARDS,
        stack: 0,
        current_move: "",
        current_card: {},
        started: false,
        players: {},
        cards: {},
    }
}



//Get next player
function NextPlayer(room, uid, by) {
    var keys = Object.keys(room.players);
    var index = keys.indexOf(uid);
    if (index == -1) { return null; } // -1, not found

    by = by * room.direction;
    index += by;

    while (index > keys.length-1) {
        index = index - keys.length;
    }

    while (index < 0) {
        index = keys.length + index;
    }

    return keys[index];
}


//Check if player can put specific card
function canPlayCard(room, card) {
    switch (card.type) {
        case "REVERSE": //Can put on same color or same type, reverse direction, can be put after stack was taken
            if (room.stack > 0 || (card.color != room.current_card.color && card.type != room.current_card.type)) { return false; }
            break;
        case "BLOCK": //Can put on same color or same type, just skip by 1 more, can be put after stack was taken
            if (room.stack > 0 || (card.color != room.current_card.color && card.type != room.current_card.type)) { return false; }
            break;
        case "PLUS_TWO": //Cannot put PLUS_TWO on PLUS_FOUR, but can put it on anything else with same color, can be put after stack was taken
            if ((room.stack > 0 && room.current_card.type == "PLUS_FOUR") || (card.color != room.current_card.color && card.type != room.current_card.type)) { return false; }
            break;
        case "PLUS_FOUR": //PLUS_FOUR can be aplied to everything there is no limits, so no need to check color or type
            break;
        case "COLOR_CHANGE": //Cannot be put on PLUS_FOUR and PLUS_TWO, but can put it on anything else with different color, can be put after stack was taken
            if ((room.stack > 0 && (room.current_card.type == "PLUS_FOUR" || room.current_card.type == "PLUS_TWO"))) { return false; }
            break;
        default:
            if (room.stack > 0 || (card.color != room.current_card.color && card.type != room.current_card.type)) { return false; }
    }

    return true;
}


//Generate random number between
function RandomRange(min, max){
    return Math.floor(Math.random()*(max-min+1)+min);
}


//Choose random card
function GenerateCard(includeSpecial) {
    if (includeSpecial && (RandomRange(1, 2) == 2)) {
        return config.cards.special[RandomRange(0, config.cards.special.length-1)];
    }

    return config.cards.standart[RandomRange(0, config.cards.standart.length-1)];
}


//Get IPV4 Address
function IPV4Address() {
    var address, ifaces = require("os").networkInterfaces();
    for (var dev in ifaces) {
        ifaces[dev].filter((details) => details.family === "IPv4" && details.internal === false ? address = details.address: undefined);
    }

    return address;
}


//Start server
server.listen(config.PORT, IPV4Address(), function() {
    console.log(`Listening on ${IPV4Address()}:${config.PORT}`);
});