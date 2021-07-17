//Variables
var my_id = "";
//var owner_id = "";
//var current_move = "";
//var current_card = {color: "ANY", type: "UNO_CARD"};


//Take card from stack
$("#carddeck").click(function(e) {
    socket.emit("take_card");
});


//Return to lobby
$("#winner-return").click(function(e) {
    location.reload();
});


//Place card when pressing place
$("#choose-place").click(function(e) {
    HideChoose();
    socket.emit("place_card", {id: $("#choose-card")[0].card.id});
});


//Save card when pressing save
$("#choose-save").click(function(e) {
    HideChoose();
    var card = $("#choose-card")[0].card;
    CreateCard(card.id, card.color, card.type);
    socket.emit("save_card", {id: card.id});
});


//Change color
$(".color").click(function(e) {
    socket.emit("change_color", {color: e.target.id});
    PlaySound("resources/sounds/color_press.mp3");
    HideColors();
});


//Start game and setup data
socket.on("start", function(data) {
    if (data.code != 200) {
        alert(data.message);
        return;
    }

    $('#UNO_CARD')[0].remove();
    $('#arrow')[0].style.visibility = null;
    PutCard(data.current_card);
    SetPlaying(data.current_move);

    $(".count").each(function() {
        this.innerHTML = Object.keys(data.cards).length;
    })

    for (const [key, value] of Object.entries(data.cards)) {
        CreateCard(key, value.color, value.type);
    }
});


//When player joined the game send him user list
socket.on("join", function(data) {
    if (data.code != 200) {
        alert(data.message);
        return;
    }

    ClearGame();
    if (data.my_id) { my_id = data.my_id; }
    //owner_id = data.owner;

    $("#login-container").addClass("hidden");
    $("#game-container").removeClass("hidden");

    for (const [key, value] of Object.entries(data.players)) {
        CreatePlayer(value.username, value.id, value.avatar, value.count);
    }

    $(`#username_${data.owner}`).addClass("crown");
});


//Info about new player
socket.on("new_player", function(data) {
    CreatePlayer(data.username, data.id, data.avatar, data.count);
});


//Glow next move username
socket.on("next_move", function(data) {
    if (data.next_move) { SetPlaying(data.next_move); }
});


//Remove player
socket.on("left", function(data) {
    //Remove player from list
    if (data.id) {
        $(`#${data.id}`)[0].addEventListener('animationend', () => {
            $(`#${data.id}`)[0].remove();
        });

        $(`#${data.id}`).addClass("remove")
    }

    //Set new owner
    if (data.new_owner) {
        $(".crown").removeClass("crown");
        $(`#username_${data.new_owner}`).addClass("crown");
    }

    //Set new playing
    if (data.current_move) {
        SetPlaying(data.current_move);
    }
});


//When card taken
socket.on("take_card", function(data) {
    //Check if we are choosing the card
    if (data.choose && data.cards) {
        var [key, value] = Object.entries(data.cards)[0];
        ShowChoose(key, value.color, value.type);
        return;
    }

    //Create cards
    if (data.cards) {
        for (const [key, value] of Object.entries(data.cards)) {
            CreateCard(key, value.color, value.type);
        }

        return;
    }

    //Hide stack, it should always be 0, cuz after taking card stack reset
    if (data.stack == 0) {
        HideStack();
    }

    //Glow next move username
    if (data.next_move) {
        SetPlaying(data.next_move);
    }

    //Change count and set overlay
    if (data.count && data.count.do_update) {
        if (data.count.uid == my_id) { PlaySound("resources/sounds/card_pickup.mp3"); }
        SetOverlay(data.count.uid, "resources/overlays/PLUS_CARD.png");
        $(`#count_${data.count.uid}`)[0].innerHTML = data.count.count;
    }
});


//When card placed
socket.on("place_card", function(data) {
    //Change arrow direction
    if (data.direction) {
        $("#arrow")[0].className = data.direction > 0 ? "arrow directionRight" : "arrow directionLeft";
    }

    //Put new card to stack
    if (data.new_card) {
        PutCard(data.new_card);
    }

    //Change count
    if (data.count) {
        $(`#count_${data.count.uid}`)[0].innerHTML = data.count.count;
    }

    //Display stack, it should be bigger than 0
    if (data.stack) {
        ShowStack(data.stack);
    }

    //Remove card and start color change
    if (data.count && data.count.uid == my_id) {
        $(`#${data.remove_card_id}`).remove();
        if (data.pickcolor && !data.winner) { ShowColors(); }
    }

    //Display the winner and return, no need to do anything else
    if (data.winner) {
        setTimeout(function() {
            $(`#winner-container`).removeClass("hidden");
            $(`#winner-wrapper`).addClass("ScaleUp");
            $(`#winner-username`)[0].innerHTML = $(`#username_${data.winner}`)[0].innerHTML;
            $(`#winner-avatar`)[0].src = $(`#avatar_${data.winner}`)[0].src;
        }, 500);

        for (var i = data.timeout; i >= 0; i--) {
            setTimeout(function(time) {
                $(`#winner-timeout`)[0].innerHTML = `Next game will start in ${time} seconds.`;
            }, (data.timeout-i)*1000, i);
        }

        return;
    }

    if (data.uno) {
        //add uno button somewhere, implement this idea later
    }

    if (data.blocked) {
        SetOverlay(data.blocked, "resources/overlays/BLOCK.png");
        if (data.blocked == my_id) { SetCover("resources/cover/SKIP.png"); }
    }
});


//Chnage card color
socket.on("change_color", function(data) {
    //current_card = {color: data.color, type: data.type}
    $(".card-desk").last()[0].src = `resources/cards/gifs/${data.color}_${data.type}.gif`;
    PlaySound("resources/sounds/change_color.mp3");
});


//Set who is playing now
function SetPlaying(uid) {
    //current_move = uid;

    if (uid == my_id) {
        $("#cards").removeClass("disabled");
        $("#carddeck").removeClass("disabled");
    } else {
        $("#cards").addClass("disabled");
        $("#carddeck").addClass("disabled");
    }

    $(".glow").removeClass("glow");
    $(`#username_${uid}`).addClass("glow");
}


//Add player to list
function CreatePlayer(username, id, src, count) {
    var divElement = document.createElement("div");
    divElement.className = "player";
    divElement.id = id;
  
    var usernameElement = document.createElement("label");
    usernameElement.className = "username";
    usernameElement.id = `username_${id}`;
    usernameElement.innerHTML = username;

    var avatarElement = document.createElement("img");
    avatarElement.className = "avatar";
    avatarElement.id = `avatar_${id}`;
    avatarElement.draggable = false;
    avatarElement.width = 64;
    avatarElement.height = 64;
    avatarElement.src = src;

    var overlayElement = document.createElement("img");
    overlayElement.className = "overlay";
    overlayElement.id = `overlay_${id}`;
    overlayElement.draggable = false;
    overlayElement.width = 64;
    overlayElement.height = 64;

    var countElement = document.createElement("label");
    countElement.className = "count";
    countElement.id = `count_${id}`;
    countElement.innerHTML = count;

    divElement.appendChild(usernameElement);
    divElement.appendChild(avatarElement);
    divElement.appendChild(overlayElement);
    divElement.appendChild(countElement);
    $("#players")[0].appendChild(divElement);
}


//Create card on desk
function PutCard(card) {
    //current_card = card;
    var img = document.createElement("img");

    img.addEventListener('animationend', () => {
        if ($(".card-desk").length >= 2) {
            $(".card-desk").first().remove();
        }
    });

    img.className = "card-desk";
    img.src = `resources/cards/${card.color}_${card.type}.png`;
    img.draggable = false;

    $('#cards-desk')[0].appendChild(img);

    switch(card.type) {
        case "REVERSE":
            PlaySound("resources/sounds/reverse.mp3");
            break;
        case "BLOCK":
            PlaySound("resources/sounds/block.mp3");
            break;
        case "PLUS_TWO":
            PlaySound("resources/sounds/plus_two.mp3");
            break;
        case "PLUS_FOUR":
            PlaySound("resources/sounds/plus_four.mp3");
            break;
        default:
            PlaySound("resources/sounds/card_place.mp3");
    }
}


//Create card on screen
function CreateCard(id, color, type) {
    var img = document.createElement("img");

    img.className = "card";
    img.id = id;
    img.color = color;
    img.type = type;
    img.src = `resources/cards/${color}_${type}.png`;
    img.draggable = false;

    img.addEventListener("click", function() {
        socket.emit("place_card", {id: id});
    }, false);

    $('#cards')[0].appendChild(img);
}


//Play audio
function PlaySound(FileName) {
    var audio = new Audio(FileName);
    audio.pause();
    audio.currentTime = 0;
    audio.play();
}


//Set overlay
function SetOverlay(id, src) {
    $(`#overlay_${id}`)[0].src = src;
    $(`#overlay_${id}`).removeClass("popup");
    void $(`#overlay_${id}`)[0].offsetWidth;
    $(`#overlay_${id}`).addClass("popup");
}


//Set cover
function SetCover(src) {
    $("#cover")[0].src = src;
    $("#cover").removeClass("popupCover");
    void $("#cover")[0].offsetWidth;
    $("#cover").addClass("popupCover");
}


//Show color change
function ShowColors() {
    $("#color-select").removeClass("PopOut");
    $("#color-select").addClass("PopIn");
}


//Hide color change
function HideColors() {
    $("#color-select").removeClass("PopIn");
    $("#color-select").addClass("PopOut");
}


//Start choose screen
function ShowChoose(id, color, type) {
    $("#choose-container").removeClass("hidden");
    $("#choose-card")[0].card = {id: id, color: color, type: type};
    $("#choose-card")[0].src = `resources/cards/${color}_${type}.png`;
    $("#choose-card").addClass("ChooseAnimation");
}

//Hide choose screen
function HideChoose() {
    $("#choose-container").addClass("hidden");
    $("#choose-card").removeClass("ChooseAnimation");
}

//Show stack counter
function ShowStack(stack) {
    $("#stacking-count")[0].innerHTML = `+${stack}`;
    $("#stacking-container").removeClass("PopOut");
    $("#stacking-container").addClass("PopIn");
}

//Hide stack counter
function HideStack() {
    $("#stacking-container").removeClass("PopIn");
    $("#stacking-container").addClass("PopOut");
}

//Reset game
function ClearGame() {
    //Hide some stuff
    HideChoose();
    HideStack();

    //Hide winner
    $(`#winner-container`).addClass("hidden");
    $(`#winner-wrapper`).removeClass("ScaleUp");

    //Disable carddeck
    $("#carddeck").addClass("disabled");

    //Remove all players
    $(".player").each(function() {
        this.remove();
    });

    //Remove all player and desk cards
    $(".card").each(function() {
        this.remove();
    });

    $(".card-desk").each(function() {
        this.remove();
    });

    //Reset arrow direction and style
    $("#arrow")[0].className = "arrow directionRight";
    $("#arrow")[0].style = "visibility: hidden;";

    //Create UNO card
    var img = document.createElement("img");
    img.className = "card-desk";
    img.id = "UNO_CARD";
    img.src = "resources/cards/UNO_CARD.png";
    img.draggable = false;
    $("#cards-desk")[0].appendChild(img);

    //Start game when pressing on middle card
    $("#UNO_CARD").click(function() {
        socket.emit("start");
    });
}