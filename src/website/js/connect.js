//Variable to store data 
var settings;
var avatar;
var timers = [];

const SETTING_TIMEOUT = 700;
const SETTING_INTERVAL = 20;


//Load username and avatar from cookies
$("#username")[0].value = localStorage["username"] || "";
if (localStorage["avatar"] && fileExists(`avatars/${localStorage["avatar"]}.png`)) {
    $("#avatar")[0].src = `avatars/${localStorage["avatar"]}.png`;
} else {
	localStorage["avatar"] = "";
    $("#avatar")[0].src = "resources/defaultAvatar.png";
}


//When click on avatar
$("#avatar").click((e) => {
    var input = document.createElement("input");
    var reader = new FileReader();

    input.setAttribute("type", "file");
    input.setAttribute("accept", ".png,.jpg,.jpeg,.bmp,.gif");

    input.onchange = (event) => {
        reader.readAsArrayBuffer(event.target.files[0]);
    }

    reader.onload = async (event) => {
        avatar = await resizeImage(event.target.result, 130, 130);
        socket.emit("avatar", { size: avatar.byteLength });
        input.remove();
    }

    input.click();
});


//When click on connect
$('#connect').click((e) => {
	if (!settings) { return; }
    var username = $('#username')[0].value;
    var invite = $('#invite')[0].value;

	localStorage["username"] = username;
	localStorage["invite"] = $('#invite')[0].value;

    socket.emit("join", {
		invite: invite,
        username: username,
        avatar: localStorage["avatar"] || "",
		player_id: localStorage["player_id"] || "",
        start_cards: parseInt($("#start-cards").children(".setting-state")[0].innerHTML),
        max_players: parseInt($("#max-players").children(".setting-state")[0].innerHTML),
        max_cards: parseInt($("#max-cards").children(".setting-state")[0].innerHTML),
        player_time: parseInt($("#player-time").children(".setting-state")[0].innerHTML),
        draw_to_match: $("#draw-to-match").children(".setting-state")[0].innerHTML,
        can_stack_cards: $("#stack-cards").children(".setting-state")[0].innerHTML,
        can_jump_in: $("#jump-in").children(".setting-state")[0].innerHTML,
        can_uno: $("#can-uno").children(".setting-state")[0].innerHTML,
		can_rejoin: $("#can-rejoin").children(".setting-state")[0].innerHTML,
    });
});


//Show settings
$("#login-container .settings").click((e) => {
    $("#login-container #settings-container")[0].style = "transform: translate(-50%, -50%) scale(1);"
});


//Close settings
$("#login-container #setting-close").click((e) => {
    $("#login-container #settings-container")[0].style = "transform: translate(-50%, -50%) scale(0);"
	localStorage["start_cards"] = $("#start-cards").children(".setting-state")[0].innerHTML;
	localStorage["max_players"] = $("#max-players").children(".setting-state")[0].innerHTML;
	localStorage["max_cards"] = $("#max-cards").children(".setting-state")[0].innerHTML;
	localStorage["player_time"] = $("#player-time").children(".setting-state")[0].innerHTML;
	localStorage["draw_to_match"] = $("#draw-to-match").children(".setting-state")[0].innerHTML;
	localStorage["stack_cards"] = $("#stack-cards").children(".setting-state")[0].innerHTML;
	localStorage["jump_in"] = $("#jump-in").children(".setting-state")[0].innerHTML;
	localStorage["can_uno"] = $("#can-uno").children(".setting-state")[0].innerHTML;
	localStorage["can_rejoin"] = $("#can-rejoin").children(".setting-state")[0].innerHTML;
});


//Switch setting to left
$(".arrow-left").mousedown((e) => {
	var arrow_left = (e) => {
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
			case "player-time":
				if (parseInt(state.innerHTML) > settings.player_time.minimum) {
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
			case "can-rejoin":
				state.innerHTML = (state.innerHTML == "ON") ? "OFF" : "ON";
				break;
		}
	}

	arrow_left(e);
	if (timers[0]) { return; }
	timers[0] = setTimeout(() => {
		timers[1] = setInterval(() => { arrow_left(e) }, SETTING_INTERVAL);
	}, SETTING_TIMEOUT);
});


$(".arrow-left").mouseup((e) => {
	if (timers[0]) { clearTimeout(timers[0]); }
	if (timers[1]) { clearInterval(timers[1]); }
	timers = [];
});


$(".arrow-left").mouseleave((e) => {
	$(e.target).trigger('mouseup');
});


//Switch setting to right
$(".arrow-right").mousedown((e) => {
	var arrow_right = (e) => {
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
			case "player-time":
				if (parseInt(state.innerHTML)+1 <= settings.player_time.maximum) {
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
			case "can-rejoin":
				state.innerHTML = (state.innerHTML == "ON") ? "OFF" : "ON";
				break;
		}
	}

	arrow_right(e);
	if (timers[0]) { return; }
	timers[0] = setTimeout(() => {
		timers[1] = setInterval(() => { arrow_right(e) }, SETTING_INTERVAL);
	}, SETTING_TIMEOUT);
});


$(".arrow-right").mouseup((e) => {
	if (timers[0]) { clearTimeout(timers[0]); }
	if (timers[1]) { clearInterval(timers[1]); }
	timers = [];
});


$(".arrow-right").mouseleave((e) => {
	$(e.target).trigger('mouseup');
});


//Load avatar from code
socket.on("avatar", (data) => {
    if (data.code != 200) {
        return alert(data.message);
    }

    if (data.accepted) {
        return socket.emit("avatar", avatar);
    }

    localStorage["avatar"] = data.avatarCode;
    $('#avatar')[0].src = avatarURL = `avatars/${data.avatarCode}.png`;
});


//Load settings
socket.on("settings", (data) => {
    settings = data;

	$("#start-cards").children(".setting-state")[0].innerHTML = localStorage["start_cards"] || data.start_cards.default;
	$("#max-players").children(".setting-state")[0].innerHTML = localStorage["max_players"] || data.max_players.default;
	$("#max-cards").children(".setting-state")[0].innerHTML = localStorage["max_cards"] || data.max_cards.default;
	$("#player-time").children(".setting-state")[0].innerHTML = localStorage["player_time"] || data.player_time.default;
	$('#invite')[0].value = localStorage["invite"] || randomRange(10000000, 99999999);

	if (localStorage["draw_to_match"]) {
		$("#draw-to-match").children(".setting-state")[0].innerHTML = localStorage["draw_to_match"];
	}

	if (localStorage["stack_cards"]) {
		$("#stack-cards").children(".setting-state")[0].innerHTML = localStorage["stack_cards"];
	}

	if (localStorage["jump_in"]) {
		$("#jump-in").children(".setting-state")[0].innerHTML = localStorage["jump_in"];
	}

	if (localStorage["can_uno"]) {
		$("#can-uno").children(".setting-state")[0].innerHTML = localStorage["can_uno"];
	}

	if (localStorage["can_rejoin"]) {
		$("#can-rejoin").children(".setting-state")[0].innerHTML = localStorage["can_rejoin"];
	}
});