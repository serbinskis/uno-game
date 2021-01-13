//Connect to socket
var socket = io.connect();

//Make some variables and constants
const DELAY = 100;
var SavedDate = new Date();

//Play audio
function PlaySound(FileName) {
    var audio = new Audio(FileName);
    audio.pause();
    audio.currentTime = 0;
    audio.play();
}

//Animation for cards
function DropDown(object, SizeBy) {
    if (SizeBy <= 0) {
        object.style = null;
        return;
    }

    object.style.top = SizeBy + "%";
    object.style.left = -(SizeBy/2) + "%";
    object.style.width = 100 + SizeBy + "%";
    object.style.height = 100 + SizeBy + "%";
    setTimeout(DropDown, 2, object, SizeBy-2);
}

//Animation for player join
function SlideLeft(object, SizeBy) {
    if (SizeBy <= 0) {
        object.style = null;
        return;
    }

    object.style.left = SizeBy + "%";
    setTimeout(SlideLeft, 1, object, SizeBy-2);
}

//Animation for player leave
function SlideRigth(object, SizeBy) {
    var leftString = object.style.left || "0%";
    var leftInteger = Number(leftString.slice(0, -1));

    if (leftInteger >= SizeBy) {
        object.remove();
        UpdateArrowLocation();
        return;
    }
    
    object.style.left = (leftInteger+2) + "%";
    setTimeout(SlideRigth, 1, object, SizeBy);
}

//Check delay so players don't spam click
function CheckDelay(Delay) {
    if ((new Date().getTime() - SavedDate.getTime()) > Delay) {
        SavedDate = new Date();
        return true;
    }

    return false;
}

//Update arrow location
function UpdateArrowLocation() {
    var arrow = document.getElementById("arrow");
    arrow.style.top = (document.getElementsByClassName("player").length) * 74 + 7 + "px";
}

//Add player to list
function CreatePlayer(username, id, src, count) {
    var divElement = document.createElement("div");
    divElement.className = "player";
    divElement.id = id;
  
    var usernameElement = document.createElement("label");
    usernameElement.className = "username";
    usernameElement.id = "username_" + id;
    usernameElement.innerHTML = username;

    var avatarElement = document.createElement("img");
    avatarElement.className = "avatar";
    avatarElement.draggable = false;
    avatarElement.width = 64;
    avatarElement.height = 64;
    avatarElement.src = src;

    var countElement = document.createElement("label");
    countElement.className = "count";
    countElement.id = "count_" + id;
    countElement.innerHTML = count;

    divElement.appendChild(usernameElement);
    divElement.appendChild(avatarElement);
    divElement.appendChild(countElement);
    document.getElementById("players").appendChild(divElement);
    UpdateArrowLocation();
    SlideLeft(divElement, 105);
}

//Create card on desk
function CreateDeskCard(id, src) {
    var img = document.createElement("img");

    img.className = "card-desk";
    img.id = id;
    img.src = src;
    img.draggable = false;

    img.addEventListener("click", CardDeskClick, false);
    document.getElementById("cards-desk").appendChild(img);
    DropDown(img, 50);
}

//Create card on screen
function CreateCard(id, src) {
    var img = document.createElement("img");

    img.className = "card";
    img.id = id;
    img.src = src;
    img.draggable = false;

    img.addEventListener("click", CardClick, false);
    document.getElementById("cards").appendChild(img);
}

//Restart game (only from console)
function restart() {
  socket.emit("restart");
}

//Start game when pressing on middle card
function StartGame() {
    socket.emit("start");
}

//Generate new card when pressing on card stack
function CardStackClick() {
    if (!CheckDelay(DELAY)) { return; }
    socket.emit("card");
}

//When clicking on card on desk
function CardDeskClick(e) {
    var CardsDesk = document.getElementsByClassName("card-desk")
    if (CardsDesk.length <= 1) { return; }
    if (!CheckDelay(DELAY)) { return; }
    socket.emit("grab", e.target.id);
}

//When clicking on card in stack
function CardClick(e) {
    if (document.getElementById("UNO_CARD")) {
        return; //If first card exists then return
    }

    if (!CheckDelay(DELAY)) { return; }
    socket.emit("drop", e.target.id);
    e.target.remove();
}

//When player joined the game send him user list
socket.on("players", function(data) {
    for (var i = 0; i < data.length; i++) {
        CreatePlayer(data[i].username, data[i].uid, data[i].avatar, data[i].count);
    }
});

//Send info about new player to already joined players
socket.on("join", function(data) {
    CreatePlayer(data.username, data.uid, data.avatar, data.count);
});

//Remove player
socket.on("left", function(data) {
    SlideRigth(document.getElementById(data), 105);
});

//Spawn first card in stack
socket.on("start", function(data) {
    document.getElementById("UNO_CARD").remove();
    PlaySound('resources/sounds/card_placed.mp3');
    CreateDeskCard(data, "resources/cards/" + data + ".png");
    var arrow = document.getElementById("arrow");
    arrow.style.visibility = null;
});

//Reload page on socket command 'reload'
socket.on("reload", function () {
    location.reload();
});

//Play specific sound
socket.on("sound", function(data) {
    PlaySound(`resources/sounds/${data}.mp3`);
});

//Spawn generated card
socket.on("card", function(data) {
    CreateCard(data, "resources/cards/" + data + ".png");
});

//Spawn dropped card in stack
socket.on("drop", function(data) {
    PlaySound('resources/sounds/card_placed.mp3');
    CreateDeskCard(data, "resources/cards/" + data + ".png");
});

//Spawn dropped card in stack
socket.on("count", function(data) {
    document.getElementById("count_" + data.uid).innerHTML = data.count;
});

//Focus specific player
socket.on("next", function(data) {
  var player = document.getElementsByClassName("username glow")[0];

  if (player) {
    player.className = "username";
  }

  document.getElementById("username_" + data).className = "username glow";
});

//Remove card from top of desk
socket.on("grab", function() {
    var CardsDesk = document.getElementsByClassName("card-desk");
    CardsDesk[CardsDesk.length-1].remove();
});

//Change arrow animation
socket.on("reverse", function(data) {
    var arrow = document.getElementById("arrow");

    if (data > 0) {
        arrow.src = "resources/directionR.png";
        arrow.className = "arrow directionR";
    } else {
        arrow.src = "resources/directionL.png";
        arrow.className = "arrow directionL";
    }
});

socket.emit("players");