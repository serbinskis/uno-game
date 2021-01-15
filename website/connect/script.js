//Connect to socket
var socket = io.connect();

//Constants
const MAX_AVATAR_SIZE = 950*1024;

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

//Upload avatar to server
function AvatarUpload() {
    var input = document.createElement("input");
    var reader = new FileReader();

    input.setAttribute("type", "file");
    input.setAttribute("accept", ".png,.jpg,.jpeg,.bmp,.gif");

    input.onchange = function(event) {
        if (event.target.files[0].size > MAX_AVATAR_SIZE) {
            input.remove();
            alert(`File is too big!`);
            return;
        }

        reader.readAsArrayBuffer(event.target.files[0]);
    }

    reader.onload = function(event) {
        socket.emit("avatar", event.target.result);
        input.remove();
    }

    input.click();
}

//When clicking connect
function ConnectClick() {
    var username = document.getElementById("username").value;

    if (username == "") {
        alert("Please write your username!");
        return;
    }

    var avatarURL = document.getElementById("avatar").src;
    var UID = String(new Date().getTime());
    SetCookie("username", username, 30*24*60*60*1000);
    SetCookie("uid", UID, 30*24*60*60*1000);
    SetCookie("connected", "true", 3*1000);
    socket.emit("join", {"username": username, "avatar": avatarURL, "uid": UID});
}

//Check if image exists
function imageExists(imageURL){
    var http = new XMLHttpRequest();
    http.open('HEAD', imageURL, false);
    http.send();
    return http.status != 404;
}

//Load data from cookies and avatar
document.getElementById("username").value = GetCookie("username");
var avatarURL = GetCookie("avatar");

//Load avatar
if (imageExists(avatarURL) && (avatarURL != "")) {
    document.getElementById("avatar").src = avatarURL;
} else {
    document.getElementById("avatar").src = "resources/defaultAvatar.png";
}

//Load avatar from url
socket.on("avatar", function(data) {
    SetCookie("avatar", data, 30*24*60*60*1000);
    document.getElementById("avatar").src = data;
});

//Reload page on socket command "reload"
socket.on("reload", function () {
    location.reload();
});

//Alert command
socket.on("alert", function(data) {
    alert(data);
});