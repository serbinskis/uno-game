//Connect to socket
var socket = io.connect();


//Constants
const MAX_AVATAR_SIZE = 950*1024;
const DELAY = 100;


//Alert command
socket.on("alert", function(data) {
    alert(data);
});


//Server closed
socket.on("closed", function (data) {
    socket.disconnect();
    document.getElementById("body").remove();
    var label = document.createElement("label");
    label.innerHTML = data;
    document.body.appendChild(label)
});


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