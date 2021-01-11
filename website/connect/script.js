//Connect to socket
var socket = io.connect();

 //Set coockie
function SetCookie(Name, Value, Time) {
    var d = new Date();
    d.setTime(d.getTime() + Time);
    var expires = "expires=" + d.toUTCString();
    document.cookie = Name + "=" + Value + ";" + expires + ";path=/";
}

//Get coockie
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
document.getElementById("avatarUpload").onchange = function(event) {
  var avatarUpload = document.getElementById("avatarUpload");
  var reader = new FileReader();

  reader.onloadend = async function(event) {
      var canvas = document.createElement("canvas");
      canvas.width = 130;
      canvas.height = 130;
      context = canvas.getContext("2d");
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "black";
      context.fillRect(13, 13, 104, 104);
      var avatarImage = new Image();

      //Load frame image
      avatarImage.onload = function () {
          var frameImage = new Image();
          frameImage.src = "resources/frame.png";

          //Draw image
          frameImage.onload = function () {
              context.drawImage(avatarImage, 13, 13, 104, 104);
              context.drawImage(frameImage, 0, 0);
              socket.emit("avatar", canvas.toDataURL());
          };
      };

      //Load avatar
      avatarImage.src = event.target.result;
  }

  //Read file
  reader.readAsDataURL(this.files[0]);
}

//When clicking on canvas
document.getElementById("avatar").onclick = function(event) {
    var avatarUpload = document.getElementById("avatarUpload");
    avatarUpload.click();
}

//When clicking connect
function ConnectClick() {
    var username = document.getElementById("username").value;
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