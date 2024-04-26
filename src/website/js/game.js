//Variables
var my_player_id = "";
var owner_id = "";
var room_id = "";
var current_move = "";
var current_time = null;
//var current_card = { color: "ANY", type: "UNO_CARD" };


//Settings button
$("#game-container #settings").click(() => {
    showSettings();
});


//Close settings
$("#game-container #setting-close").click(() => {
    hideSettings();
});


//Leave game
$("#game-container #setting-leave").click(() => {
    location.reload();
});


//When mouse hovers where is room id, show it
$("#room-id").mouseenter((e) => {
    $(e.target)[0].timer = setTimeout(() => {
        $(e.target)[0].innerText = room_id;
    }, 200);
});


//When mouse leaves where is room id, hide it
$("#room-id").mouseleave((e) => {
    if ($(e.target)[0].timer) { clearTimeout($(e.target)[0].timer); }
	$(e.target)[0].innerText = '*'.repeat(room_id.length);
});


//Copy room id when pressed
$("#room-id").mousedown(() => {
    const copy = document.createElement('textArea');
    copy.value = room_id;
    document.body.appendChild(copy);
    copy.select();
    document.execCommand('copy');
    document.body.removeChild(copy);
    alert('Room id copied.');
});


//Take card from stack
$("#carddeck").click(() => {
    socket.emit("take_card");
});


//When pressing UNO
$("#uno").click(() => {
    socket.emit("uno_press");
});


//Return to lobby
$("#winner-return").click(() => {
    location.reload();
});


//Place card when pressing place
$("#choose-place").click(() => {
    hideChoose();
    socket.emit("place_card", { card_id: $("#choose-card")[0].card.card_id });
    $("#choose-card")[0].card = null;
});


//Save card when pressing save
$("#choose-save").click(() => {
    hideChoose();
    var card = $("#choose-card")[0].card;
    $("#choose-card")[0].card = null;
    createCard(card.card_id, card.color, card.type);
    socket.emit("save_card", { card_id: card.card_id });
});


//Change color
$(".color").click((e) => {
    socket.emit("change_color", { color: e.target.id });
    playSound("resources/sounds/color_press.mp3");
});


//Start game and setup data
socket.on("start", (data) => {
    if (data.code != 200) {
        return alert(data.message);
    }

    $("#UNO_CARD")[0].remove();
    $("#arrow")[0].style.visibility = null;
    putCard(data.current_card);
    setPlaying(data.current_move, data.player_time);

    $(".count").each(function() {
        this.innerHTML = Object.keys(data.cards).length;
    });

    for (const [key, value] of Object.entries(data.cards)) {
        createCard(key, value.color, value.type);
    }

    localStorage["player_id"] = my_player_id;
});


//When socket is disconnected save our player_id to rejoin
//This is needed here only if you play from same device with multiple accounts
//But this won't help if multiple accounts disconnect at the same time
//And for some reason this event is not even being fired
socket.on("disconnect", () => {
    if (my_player_id != "") { localStorage["player_id"] = my_player_id; }
});


//When player joined the game send him user list
socket.on("join", (data) => {
    if (data.code != 200) {
        return alert(data.message);
    }

    clearGame();
    if (data.room_id) { room_id = data.room_id; }
    if (data.player_id) { my_player_id = data.player_id; }
    owner_id = data.owner_id;

    $("#login-container").addClass("hidden");
    $("#game-container").removeClass("hidden");
    $("#room-id")[0].innerText = '*'.repeat(room_id.length);

    for (const player of Object.values(data.players)) {
        if (player.left) { continue; }
        createPlayer(player.username, player.player_id, player.avatar, player.card_count, player.disconnected);
    }

    $(`#username_${data.owner_id}`).addClass("crown");
});


//Info about new player
socket.on("new_player", (data) => {
    createPlayer(data.username, data.player_id, data.avatar, data.card_count);
    prepareSettings();
});


//Enable cards for player when its posible to jump in
socket.on("can_jump_in", (data) => {
    $("#cards").removeClass("disabled");

    for (const [index, card_id] of Object.entries(data.cards)) {
        $(`#${card_id}`).addClass("jumpin");
    }
});


//Glow next move username
socket.on("next_move", (data) => {
    if (data.next_move) {
        setPlaying(data.next_move, data.player_time);
        $("#uno")[0].style = "transform: scale(0);"
    }

    if (data.jumped_in) {
        setOverlay(data.next_move, "resources/overlays/JUMP_IN.png"); //Set overlay for player who jumped in
        if (data.jumped_in == my_player_id) { setCover("resources/covers/JUMP_IN.png"); } //Set cover for player who lost turn
    }

    if ($("#choose-card")[0].card) {
        hideChoose();
        var card = $("#choose-card")[0].card;
        $("#choose-card")[0].card = null;
        createCard(card.card_id, card.color, card.type);
        playSound("resources/sounds/card_pickup.mp3");
    }
});


//Remove player
socket.on("disconnected", (data) => {
    //Mark player as disconnected if he can rejoin
    if (data.disconnected_id) {
        $(`#username_${data.disconnected_id}`).addClass("disconnected");
    }

    //Remove player from list if player left
    if (data.left_id) {
        $(`#${data.left_id}`)[0].addEventListener('animationend', () => {
            $(`#${data.left_id}`)[0].remove();
        });

        $(`#${data.left_id}`)[0].left = true;
        setTimeout(() => $(`#${data.left_id}`).addClass("remove"), 300);
    }

    //Set new owner
    if (data.new_owner) {
        owner_id = data.new_owner;
        $(".crown").removeClass("crown");
        $(`#username_${data.new_owner}`).addClass("crown");
    }

    //Recreate setting player list
    prepareSettings();

    //Set new playing
    if (data.current_move) {
        setPlaying(data.current_move, data.player_time);
    }

    //Remove stack
    if (data.stack == 0) {
        hideStack();
    }
});


//When card taken
socket.on("take_card", (data) => {
    //Check if we are choosing the card
    if (data.choose && data.cards) {
        var [card_id, card] = Object.entries(data.cards)[0];
        return showChoose(card_id, card.color, card.type);
    }

    //Create cards
    if (data.cards) {
        for (const [card_id, card] of Object.entries(data.cards)) {
            createCard(card_id, card.color, card.type);
        }

        return;
    }

    //Hide stack, it should always be 0, cuz after taking card stack reset
    if (data.stack == 0) {
        hideStack();
    }

    //Glow next move username
    if (data.next_move) {
        setPlaying(data.next_move, data.player_time);
    }

    //Change count and set overlay
    if (data.update?.do_update) {
        if (data.update.player_id == my_player_id) { playSound("resources/sounds/card_pickup.mp3"); }
        setOverlay(data.update.player_id, "resources/overlays/PLUS_CARD.png");
        $(`#count_${data.update.player_id}`)[0].innerHTML = data.update.card_count;
    }
});


//When card placed
socket.on("place_card", (data) => {
    //Change arrow direction
    if (data.direction) {
        $("#arrow")[0].className = data.direction > 0 ? "arrow directionRight" : "arrow directionLeft";
    }

    //Put new card to stack
    if (data.new_card) {
        putCard(data.new_card);
    }

    //Change card count
    if (data.player_id && !isNaN(data.card_count)) {
        $(`#count_${data.player_id}`)[0].innerHTML = data.card_count;
    }

    //Display stack, it should be bigger than 0
    if (data.stack > 0) {
        showStack(data.stack);
    }

    //Remove card and start color change
    if (data.player_id == my_player_id) {
        $(`#${data.remove_card_id}`).remove();
        if (data.pickcolor && !data.winner_id) { showColors(); }
    }

    //Display the winner and return, no need to do anything else
    if (data.winner_id) {
        setTimeout(() => {
            $(`#winner-container`).removeClass("hidden");
            $(`#winner-wrapper`).addClass("ScaleUp");
            $(`#winner-username`)[0].innerHTML = $(`#username_${data.winner_id}`)[0].innerHTML;
            $(`#winner-avatar`)[0].src = $(`#avatar_${data.winner_id}`)[0].src;
        }, 500);

        for (var i = data.timeout; i >= 0; i--) {
            setTimeout((time) => {
                $(`#winner-timeout`)[0].innerHTML = `Next game will start in ${time} seconds.`;
            }, (data.timeout-i)*1000, i);
        }

        return;
    }

    //Set uno for specific player
    if (data.player_id && data.uno_id) {
        $("#uno-wrapper")[0].style = `left: calc(50% + ${data.uno_x}px); top: calc(50% + ${data.uno_y}px);`
        $("#uno")[0].player_id = data.player_id;
        $("#uno")[0].style = "transform: scale(1);"
    } else {
        $("#uno")[0].style = "transform: scale(0);"
    }

    if (data.blocked) {
        setOverlay(data.blocked, "resources/overlays/BLOCK.png");
        if (data.blocked == my_player_id) { setCover("resources/covers/SKIP.png"); }
    }
});


//Chnage card color
socket.on("change_color", (data) => {
    //current_card = { color: data.color, type: data.type }
    $(".card-desk").last()[0].src = `resources/cards/gifs/${data.color}_${data.type}.gif`;
    playSound("resources/sounds/change_color.mp3");
    hideColors();
});


//Update info about uno button
socket.on("uno_press", (data) => {
    $("#uno")[0].style = "transform: scale(0);"

    if (data && data.uno_id && !isNaN(data.card_count)) {
        $(`#count_${data.uno_id}`)[0].innerHTML = data.card_count;
    }
});


//When player get kicked
socket.on("kick", (data) => {
    alert(data.message);
    location.reload();
});


//Set who is playing now
function setPlaying(player_id, player_time) {
    current_move = player_id;

    if (current_time) { clearInterval(current_time); }
    if (player_time > 0) { setOverlayText(player_id, player_time); }

    current_time = setInterval(() => {
        player_time = player_time-1;
        if (!(player_time > -1)) { return; } //This will also be true if player_time is NaN
        setOverlayText(player_id, player_time);
    }, 1000);

    $(".card").each(function() {
        $(this).removeClass("jumpin");
    });

    if (player_id == my_player_id) {
        $("#cards").removeClass("disabled");
        $("#carddeck").removeClass("disabled");
    } else {
        $("#cards").addClass("disabled");
        $("#carddeck").addClass("disabled");
    }

    $(".glow").removeClass("glow");
    $(`#username_${player_id}`).addClass("glow");
}


//Add player to list
function createPlayer(username, player_id, avatar, card_count, disconnected) {
    if ($(`#${player_id}`)[0]) {
        $(`#username_${player_id}`).removeClass("disconnected");
        $(`#username_${player_id}`)[0].innerHTML = username;
        $(`#avatar_${player_id}`)[0].src = avatar;
        return;
    }

    var divElement = document.createElement("div");
    divElement.className = "player";
    divElement.id = player_id;
  
    var usernameElement = document.createElement("label");
    usernameElement.className = "username" + (disconnected ? " disconnected" : "");
    usernameElement.id = `username_${player_id}`;
    usernameElement.innerHTML = username;

    var avatarElement = document.createElement("img");
    avatarElement.className = "avatar";
    avatarElement.id = `avatar_${player_id}`;
    avatarElement.draggable = false;
    avatarElement.width = 64;
    avatarElement.height = 64;
    avatarElement.src = avatar;

    var overlayElement = document.createElement("img");
    overlayElement.className = "overlay";
    overlayElement.id = `overlay_${player_id}`;
    overlayElement.draggable = false;
    overlayElement.width = 64;
    overlayElement.height = 64;

    var countElement = document.createElement("label");
    countElement.className = "count";
    countElement.id = `count_${player_id}`;
    countElement.innerHTML = card_count;

    divElement.appendChild(usernameElement);
    divElement.appendChild(avatarElement);
    divElement.appendChild(overlayElement);
    divElement.appendChild(countElement);
    $("#players")[0].appendChild(divElement);
}


//Create player in settings
function createSettingPlayer(username, player_id, src) {
    var divElement = document.createElement("div");
    divElement.className = "setting setting-player";

    var avatarElement = document.createElement("img");
    avatarElement.className = "setting-avatar";
    avatarElement.src = src;
    avatarElement.draggable = false;

    var usernameElement = document.createElement("label");
    usernameElement.className = "setting-username";
    usernameElement.innerHTML = username;

    var isDisconnected = $(`#username_${player_id}`)[0].classList.contains("disconnected");
    if (owner_id == player_id) { usernameElement.className += " crown"; }
    if (isDisconnected) { usernameElement.className += " disconnected"; }

    var kickElement = document.createElement("span");
    kickElement.className = "button kick";
    kickElement.innerHTML = "Kick";

    kickElement.addEventListener("click", () => {
        socket.emit("kick", { player_id: player_id });
    }, false);

    if (my_player_id == player_id) { kickElement.className += " disabled"; }
    if (my_player_id != owner_id) { kickElement.className += " invisible"; }

    divElement.appendChild(avatarElement);
    divElement.appendChild(usernameElement);
    divElement.appendChild(kickElement);
    $("#game-container #settings-wrapper")[0].appendChild(divElement);
}


//Create card on screen
function createCard(id, color, type) {
    var img = document.createElement("img");

    img.className = "card";
    img.id = id;
    img.color = color;
    img.type = type;
    img.src = `resources/cards/${color}_${type}.png`;
    img.draggable = false;

    img.addEventListener("click", () => {
        socket.emit("place_card", { card_id: id });
    }, false);

    $('#cards')[0].appendChild(img);
}


//Create card on desk
function putCard(card) {
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
            playSound("resources/sounds/reverse.mp3");
            break;
        case "BLOCK":
            playSound("resources/sounds/block.mp3");
            break;
        case "PLUS_TWO":
            playSound("resources/sounds/plus_two.mp3");
            break;
        case "PLUS_FOUR":
            playSound("resources/sounds/plus_four.mp3");
            break;
        default:
            playSound("resources/sounds/card_place.mp3");
    }
}


//Play audio
function playSound(fileName) {
    var audio = new Audio(fileName);
    audio.pause();
    audio.currentTime = 0;
    audio.play();
}

//Do the same as setOverlay but with generated text
function setOverlayText(id, text) {
    var canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    var ctx = canvas.getContext("2d");

    ctx.font = "27px Uni_Sans_Heavy";
    ctx.fillStyle = "white";
    ctx.lineWidth = 1.7;
    ctx.strokeStyle = "black";
    var x = (canvas.width - ctx.measureText(text).width)/2;
    var fontSize = parseInt(ctx.font.match(/\d+/), 10);
    var y = (canvas.height/2 + fontSize/2)-2;

    ctx.fillText(text, x, y);
    ctx.strokeText(text, x, y);
    setOverlay(id, canvas.toDataURL("image/png"));
}

//Set overlay on user icon
function setOverlay(id, src) {
    $(`#overlay_${id}`)[0].src = src;
    $(`#overlay_${id}`).removeClass("popup");
    void $(`#overlay_${id}`)[0].offsetWidth;
    $(`#overlay_${id}`).addClass("popup");
}


//Set cover over the screen
function setCover(src) {
    $("#cover")[0].src = src;
    $("#cover").removeClass("popupCover");
    void $("#cover")[0].offsetWidth;
    $("#cover").addClass("popupCover");
}


//Show color change
function showColors() {
    $("#color-select").removeClass("PopOut");
    $("#color-select").addClass("PopIn");
}


//Hide color change
function hideColors() {
    if (!$("#color-select").hasClass("PopIn")) { return; }
    $("#color-select").removeClass("PopIn");
    $("#color-select").addClass("PopOut");
}


//Start choose screen
function showChoose(card_id, color, type) {
    $("#choose-container").removeClass("hidden");
    $("#choose-card")[0].card = { card_id: card_id, color: color, type: type };
    $("#choose-card")[0].src = `resources/cards/${color}_${type}.png`;
    $("#choose-card").addClass("ChooseAnimation");
}

//Hide choose screen
function hideChoose() {
    $("#choose-container").addClass("hidden");
    $("#choose-card").removeClass("ChooseAnimation");
}

//Show stack counter
function showStack(stack) {
    $("#stacking-count")[0].innerHTML = `+${stack}`;
    $("#stacking-container").removeClass("PopOut");
    $("#stacking-container").addClass("PopIn");
}

//Hide stack counter
function hideStack() {
    if (!$("#stacking-container").hasClass("PopIn")) { return; }
    $("#stacking-container").removeClass("PopIn");
    $("#stacking-container").addClass("PopOut");
}


//Show settings
function showSettings() {
    prepareSettings();
    $("#game-container #settings-container")[0].style = "transform: translate(-50%, -50%) scale(1);"
}


//Prepare settings
function prepareSettings() {
    var scrollTop = $("#game-container #settings-wrapper")[0].scrollTop;

    $(".setting-player").each(function() {
        this.remove();
    });

    $(".username").each(function() {
        if (!$(this).parent()[0].left) {
            var username = this.innerHTML;
            var id = this.id.replace("username_", "");
            var src = $(`#avatar_${id}`)[0].src;
            createSettingPlayer(username, id, src);
        }
    });

    $("#game-container #settings-wrapper")[0].scrollTop = scrollTop;
}


//Hide settings
function hideSettings() {
    $("#game-container #settings-container")[0].style = "transform: translate(-50%, -50%) scale(0);"
}


//Reset game
function clearGame() {
    //Hide some stuff
    hideColors()
    hideChoose();
    hideStack();
    hideSettings();

    //Hide winner
    $(`#winner-container`).addClass("hidden");
    $(`#winner-wrapper`).removeClass("ScaleUp");

    //Disable carddeck
    $("#carddeck").addClass("disabled");

    //Remove all players
    $(".player").each(function() {
        this.remove();
    });

    //Remove all players cards
    $(".card").each(function() {
        this.remove();
    });

    //Remove all cards from desk
    $(".card-desk").each(function() {
        this.remove();
    });

    //Reset arrow direction and style
    $("#arrow")[0].className = "arrow directionRight";
    $("#arrow")[0].style = "visibility: hidden;";
    $("#uno")[0].style = "transform: scale(0);"

    //Create UNO card
    var img = document.createElement("img");
    img.className = "card-desk";
    img.id = "UNO_CARD";
    img.src = "resources/cards/UNO_CARD.png";
    img.draggable = false;
    $("#cards-desk")[0].appendChild(img);

    //Start game when pressing on middle card
    $("#UNO_CARD").click(() => {
        socket.emit("start");
    });
}