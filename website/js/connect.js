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
        if (event.target.files[0].size > MAX_AVATAR_SIZE) {
            input.remove();
            alert("File is too big!");
            return;
        }

        reader.readAsArrayBuffer(event.target.files[0]);
    }

    reader.onload = function(event) {
        socket.emit("avatar", event.target.result);
        input.remove();
    }

    input.click();
});


//When click on connect
$('#connect').click(function(e) {
    var username = $('#username')[0].value;
    var invite = $('#invite')[0].value;

    if (!username || !username.match(/^.{2,24}$/)) {
        alert("Username is too short or too long!");
        return;
    }

    if (!invite || !invite.match(/^.[0-9a-z]{7,7}$/)) {
        alert("Invalid invite!");
        return;
    }

    SetCookie("username", username, 30*24*60*60*1000);
    socket.emit("join", {invite: invite, username: username, avatar: GetCookie("avatar")});
});


//Load avatar from code
socket.on("avatar", function(data) {
    if (data.code != 200) {
        alert(data.message);
        return;
    }

    SetCookie("avatar", data.avatarCode, 30*24*60*60*1000);
    $('#avatar')[0].src = avatarURL = "avatars/" + data.avatarCode + ".png";
});