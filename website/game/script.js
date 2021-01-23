//Connect to socket
var socket = io.connect();

//Make some variables and constants
const DELAY = 100;
var SavedDate = new Date();

 //Set cookie
 function SetCookie(Name, Value, Time) {
    var d = new Date();
    d.setTime(d.getTime() + Time);
    var expires = "expires=" + d.toUTCString();
    document.cookie = Name + "=" + Value + ";" + expires + ";path=/";
}

//Get cookie
function GetCookie(Name) {
    var search = Name + "=";
    var ca = document.cookie.split(";");

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

//Play audio
function PlaySound(FileName) {
    var audio = new Audio(FileName);
    audio.pause();
    audio.currentTime = 0;
    audio.play();
}

//Check delay so players don't spam click
function CheckDelay(Delay) {
    if ((new Date().getTime() - SavedDate.getTime()) > Delay) {
        SavedDate = new Date();
        return true;
    }

    return false;
}

//Show color change
function ShowColors() {
    var colors = document.getElementById("color-select");
    colors.style = null;
    colors.classList.remove("HideColor");
    colors.classList.add("ShowColors");
}

//Hide color change
function HideColors() {
    var colors = document.getElementById("color-select");
    colors.classList.remove("ShowColors");
    colors.classList.add("HideColor");
}

//Change color
function ChangeColor(object) {
    PlaySound(`resources/sounds/color_press.mp3`);
    socket.emit("color", object.id);
    HideColors();
}

//Set overlay
function SetOverlay(id, src) {
    var overlay = document.getElementById(id);
    overlay.src = src;
    overlay.classList.remove("popup");
    void overlay.offsetWidth;
    overlay.classList.add("popup");
}

//Set cover
function SetCover(src) {
    var cover = document.getElementById("cover");
    cover.src = src;
    cover.style = null;

    cover.addEventListener('animationend', () => {
        cover.style = "visibility: hidden;";
    });

    cover.classList.remove("popupCover");
    void cover.offsetWidth;
    cover.classList.add("popupCover");
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

    var overlayElement = document.createElement("img");
    overlayElement.className = "overlay";
    overlayElement.id = "overlay_" + id;
    overlayElement.draggable = false;
    overlayElement.width = 64;
    overlayElement.height = 64;

    var countElement = document.createElement("label");
    countElement.className = "count";
    countElement.id = "count_" + id;
    countElement.innerHTML = count;

    divElement.appendChild(usernameElement);
    divElement.appendChild(avatarElement);
    divElement.appendChild(overlayElement);
    divElement.appendChild(countElement);
    document.getElementById("players").appendChild(divElement);
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

//Start game when pressing on middle card
function StartGame() {
    socket.emit("start");
}

//Generate new card when pressing on card stack
function CardStackClick() {
    if (!CheckDelay(DELAY)) { return; }
    var CardsDesk = document.getElementsByClassName("card-desk");
    socket.emit("card", CardsDesk[CardsDesk.length-1].id);
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
    player = document.getElementById(data);

    player.addEventListener('animationend', () => {
        player.remove();
    });
      
    player.classList.add("remove");
});

//Spawn first card in stack
socket.on("start", function(data) {
    document.getElementById("UNO_CARD").remove();
    CreateDeskCard(data, "resources/cards/" + data + ".png");
    var arrow = document.getElementById("arrow");
    arrow.style.visibility = null;
});

//Server closed
socket.on("closed", function (data) {
    document.getElementById("body").remove();
    document.getElementsByTagName("body")[0].style = "font-family: null; cursor: auto;"
    document.getElementById("closed").innerHTML = data;
});

//Game realod
socket.on("restart", function () {
    SetCookie("connected", "false", 3*1000);
    location.reload();
});

//Play specific sound
socket.on("sound", function(data) {
    PlaySound(`resources/sounds/${data}.mp3`);
});

//Set overlay
socket.on("overlay", function(data) {
    SetOverlay("overlay_" + data.uid, "resources/overlays/" + data.overlay + ".png");
});

//Set cover
socket.on("cover", function(data) {
    if (GetCookie("uid") == data.uid) {
        SetCover("resources/cover/" + data.cover + ".png");
    }
});

//Show color selector
socket.on("colors", function() {
    ShowColors();
});

//Change card color
socket.on("color", function(data) {
    var CardsDesk = document.getElementsByClassName("card-desk");
    var Card = CardsDesk[CardsDesk.length-1];

    if ((Card.id == "PLUS_FOUR") || (Card.id == "COLOR_CHANGE")) {
        Card.src = "resources/cards/" + Card.id + "_" + data + ".png";
    }
});

//Spawn generated card
socket.on("card", function(data) {
    CreateCard(data, "resources/cards/" + data + ".png");
});

//Spawn dropped card in stack
socket.on("drop", function(data) {
    HideColors();
    CreateDeskCard(data, "resources/cards/" + data + ".png");
});

//Remove card from top of desk
socket.on("grab", function() {
    HideColors();
    var CardsDesk = document.getElementsByClassName("card-desk");
    CardsDesk[CardsDesk.length-1].remove();
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

//Change arrow animation
socket.on("reverse", function(data) {
    var arrow = document.getElementById("arrow");

    if (data > 0) {
        arrow.className = "arrow directionRight";
    } else {
        arrow.className = "arrow directionLeft";
    }
});

//Get players list
socket.emit("players");