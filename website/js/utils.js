//Connect to socket
var socket = io.connect();

//Constants
const DEFAULT_SAVE_TIME = 30*24*60*60*1000;


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


//Check if file exists
function fileExists(url) {
    try {
        var http = new XMLHttpRequest();
        http.open('HEAD', url, false);
        http.send();
        return http.status != 404;
    } catch(err) {
        return false;
    }
}


//Check number between
function Between(num, a, b) {
    var min = Math.min.apply(Math, [a, b]), max = Math.max.apply(Math, [a, b]);
    return (num != null) && (num >= min && num <= max);
};



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