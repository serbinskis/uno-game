//Variable to store data 
var settings;
var avatar;

//Load username and avatar from cookies
$("#username")[0].value = GetCookie("username");
if ((GetCookie("avatar") != "") && fileExists(`avatars/${GetCookie("avatar")}.png`)) {
    $("#avatar")[0].src = `avatars/${GetCookie("avatar")}.png`;
} else {
    SetCookie("avatar", "", 0); //Clear cookie
    $("#avatar")[0].src = "resources/defaultAvatar.png";
}


//When click on avatar
$("#avatar").click(function(e) {
    var input = document.createElement("input");
    var reader = new FileReader();

    input.setAttribute("type", "file");
    input.setAttribute("accept", ".png,.jpg,.jpeg,.bmp,.gif");

    input.onchange = function(event) {
        reader.readAsArrayBuffer(event.target.files[0]);
    }

    reader.onload = function(event) {
        avatar = event.target.result;
        socket.emit("avatar", {size: avatar.byteLength});
        input.remove();
    }

    input.click();
});


//When click on connect
$('#connect').click(function(e) {
    var username = $('#username')[0].value;
    var invite = $('#invite')[0].value;

    SetCookie("username", username, 30*24*60*60*1000);
    socket.emit("join", {invite: invite,
                         username: username,
                         avatar: GetCookie("avatar"),
                         start_cards: parseInt($("#start-cards").children(".setting-state")[0].innerHTML),
                         max_players: parseInt($("#max-players").children(".setting-state")[0].innerHTML),
                         max_cards: parseInt($("#max-cards").children(".setting-state")[0].innerHTML),
                         draw_to_match: $("#draw-to-match").children(".setting-state")[0].innerHTML,
                         can_stack_cards: $("#stack-cards").children(".setting-state")[0].innerHTML,
                         can_jump_in: $("#jump-in").children(".setting-state")[0].innerHTML,
                         can_uno: $("#can-uno").children(".setting-state")[0].innerHTML,
    });
});


//Show settings
$("#login-container .settings").click(function() {
    $("#login-container #settings-container")[0].style = "transform: translate(-50%, -50%) scale(1);"
});


//Close settings
$("#login-container #setting-close").click(function() {
    $("#login-container #settings-container")[0].style = "transform: translate(-50%, -50%) scale(0);"
    SetCookie("start_cards", $("#start-cards").children(".setting-state")[0].innerHTML, DEFAULT_SAVE_TIME);
    SetCookie("max_players", $("#max-players").children(".setting-state")[0].innerHTML, DEFAULT_SAVE_TIME);
    SetCookie("max_cards", $("#max-cards").children(".setting-state")[0].innerHTML, DEFAULT_SAVE_TIME);
    SetCookie("draw_to_match", $("#draw-to-match").children(".setting-state")[0].innerHTML, DEFAULT_SAVE_TIME);
    SetCookie("stack_cards", $("#stack-cards").children(".setting-state")[0].innerHTML, DEFAULT_SAVE_TIME);
    SetCookie("jump_in", $("#jump-in").children(".setting-state")[0].innerHTML, DEFAULT_SAVE_TIME);
    SetCookie("can_uno", $("#can-uno").children(".setting-state")[0].innerHTML, DEFAULT_SAVE_TIME);
});


//Switch setting to left
$(".arrow-left").click(function(e) {
    if (!settings) { return; }
    var type = $(e.target).parent()[0].id;
    var state = $(`#${type}`).children(".setting-state")[0];

    switch (type) {
        case "max-players":
            if (parseInt(state.innerHTML) > settings.max_players.minimum) {
                state.innerHTML = parseInt(state.innerHTML)-1;
            }
            break;
        case "max-cards":
            if (parseInt(state.innerHTML) > settings.max_cards.minimum) {
                state.innerHTML = parseInt(state.innerHTML)-1;
            }
            break;
        case "start-cards":
            if (parseInt(state.innerHTML) > settings.start_cards.minimum) {
                state.innerHTML = parseInt(state.innerHTML)-1;
            }
            break;
        case "draw-to-match":
            state.innerHTML = (state.innerHTML == "ON") ? "OFF" : "ON";
            break;
        case "stack-cards":
            state.innerHTML = (state.innerHTML == "ON") ? "OFF" : "ON";
            break;
        case "jump-in":
            state.innerHTML = (state.innerHTML == "ON") ? "OFF" : "ON";
            break;
        case "can-uno":
            state.innerHTML = (state.innerHTML == "ON") ? "OFF" : "ON";
            break;
    }
});


//Switch setting to right
$(".arrow-right").click(function(e) {
    if (!settings) { return; }
    var type = $(e.target).parent()[0].id;
    var state = $(`#${type}`).children(".setting-state")[0];

    switch (type) {
        case "max-players":
            if (parseInt(state.innerHTML)+1 <= settings.max_players.maximum) {
                state.innerHTML = parseInt(state.innerHTML)+1;
            }
            break;
        case "max-cards":
            if (parseInt(state.innerHTML)+1 <= settings.max_cards.maximum) {
                state.innerHTML = parseInt(state.innerHTML)+1;
            }
            break;
        case "start-cards":
            if (parseInt(state.innerHTML)+1 <= settings.start_cards.maximum) {
                state.innerHTML = parseInt(state.innerHTML)+1;
            }
            break;
        case "draw-to-match":
            state.innerHTML = (state.innerHTML == "ON") ? "OFF" : "ON";
            break;
        case "stack-cards":
            state.innerHTML = (state.innerHTML == "ON") ? "OFF" : "ON";
            break;
        case "jump-in":
            state.innerHTML = (state.innerHTML == "ON") ? "OFF" : "ON";
            break;
        case "can-uno":
            state.innerHTML = (state.innerHTML == "ON") ? "OFF" : "ON";
            break;
    }
});


//Load avatar from code
socket.on("avatar", function(data) {
    if (data.code != 200) {
        alert(data.message);
        return;
    }

    if (data.accepted) {
        socket.emit("avatar", avatar);
        return;
    }

    SetCookie("avatar", data.avatarCode, DEFAULT_SAVE_TIME);
    $('#avatar')[0].src = avatarURL = "avatars/" + data.avatarCode + ".png";
});


//Load settings
socket.on("settings", function(data) {
    settings = data;

    if (GetCookie("start_cards") != "") {
        $("#start-cards").children(".setting-state")[0].innerHTML = GetCookie("start_cards");
    } else {
        $("#start-cards").children(".setting-state")[0].innerHTML = data.start_cards.default;
    }

    if (GetCookie("max_players") != "") {
        $("#max-players").children(".setting-state")[0].innerHTML = GetCookie("max_players");
    } else {
        $("#max-players").children(".setting-state")[0].innerHTML = data.max_players.default;
    }

    if (GetCookie("max_cards") != "") {
        $("#max-cards").children(".setting-state")[0].innerHTML = GetCookie("max_cards");
    } else {
        $("#max-cards").children(".setting-state")[0].innerHTML = data.max_cards.default;
    }

    if (GetCookie("draw_to_match") != "") {
        $("#draw-to-match").children(".setting-state")[0].innerHTML = GetCookie("draw_to_match");
    }

    if (GetCookie("stack_cards") != "") {
        $("#stack-cards").children(".setting-state")[0].innerHTML = GetCookie("stack_cards");
    }

    if (GetCookie("jump_in") != "") {
        $("#jump-in").children(".setting-state")[0].innerHTML = GetCookie("jump_in");
    }

    if (GetCookie("can_uno") != "") {
        $("#can-uno").children(".setting-state")[0].innerHTML = GetCookie("can_uno");
    }
});