var socket = io('/super');
$(document).ready(function() {
    $(".timer_start").click(function() {
        var dur = $(".timer_duration").val();
        var warn = $(".timer_warn").val();
        var alert = $(".timer_alert").val();
        socket.emit("start timer", dur, warn, alert);
    });
    $(".timer_stop").click(function() {
        socket.emit("stop timer");
    });
    $(".send_question").click(function() {
        socket.emit("send new question");
    });
    socket.on("password", function(type) {
        var password = prompt("wat is het wachtwoord?");
        socket.emit('password', type, password);
    });
    socket.on('alert', (incoming) => {
        alert(incoming);
    });
    socket.on("disconnect", (reason) => {
        console.log('disconnected');
    });
    socket.on("reconnect", () => {
        console.log('reconnected');
    });
    socket.on('redirect', (url) => {
        console.log(url);
        window.location.replace(url);
    });
    socket.on('next question', (question) => {
        $(".questions").html(question);
    });
    socket.on("polygon update", (status, id, name) => {
        if (status == "out") {
            if ($("#" + id).length == 0) {
                $(".location_info").html("<div id=\"" + id + "\"><p>" + id + " is niet in een polygon.</p></div>");
            } else {
                $("#" + id).html("<p>" + id + " is niet in een polygon.</p>");
            }
        }
        if (status == "in") {
            if ($("#" + id).length == 0) {
                $(".location_info").html("<div id=\"" + id + "\"><p>" + id + "is in de polygon \"" + name + "\"!</p></div>");
            } else {
                $("#" + id).html("<p>" + id + "is in de polygon \"" + name + "\"!</p>");
            }
        }
    });
});