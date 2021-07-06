var socket = io('/super');
var chatSocket = io('/chat');
const disable_marker = true;

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
    var firstQuestion = true;
    socket.on('next question', (question) => {
        $(".questions").html(question);
        if (!firstQuestion) {
            $(".send_question").text("Volgende vraag");
            firstQuestion = false;
        }
    });
    socket.on("clear questions", () => {
        $('.questions').html("");
    });
    socket.on('list question', (question) => {
        $(".questions").append("<p>" + question.question + "</p><button class=\"send_question\" id=\"" + question.num + "\">Verstuur vraag</button><br>");
    });
    socket.on("start listening", () => {
        $(".send_question").click(function() {
            btnId = this.id;
            socket.emit("send new question", btnId);
        });
    })
    socket.on("polygon update", (status, id, name) => {
        if (status == "out") {
            if ($("#" + id).length == 0) {
                $(".location_info").append("<div id=\"" + id + "\"><p>" + id + " is niet in een polygon.</p></div>");
            } else {
                $("#" + id).html("<p>" + id + " is niet in een polygon.</p>");
            }
        }
        if (status == "in") {
            if ($("#" + id).length == 0) {
                $(".location_info").append("<div id=\"" + id + "\"><p>" + id + "is in de polygon \"" + name + "\"!</p></div>");
            } else {
                $("#" + id).html("<p>" + id + "is in de polygon \"" + name + "\"!</p>");
            }
        }
    });
    var messages = document.getElementById('messages');
    var form = document.getElementById('form');
    var input = document.getElementById('input');

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        if (input.value) {
            chatSocket.emit('chat message', input.value, "Supervisor", $.now());
            input.value = '';
        }
    });

    chatSocket.on('chat message', function(msg, sender, timestamp) {
        var item = document.createElement('li');
        item.textContent = formatTime(timestamp) + " [" + sender + "]: " + msg;
        messages.appendChild(item);
        //window.scrollTo(0, document.body.scrollHeight);
        $('#messages').scrollTop($('#messages')[0].scrollHeight);
    });

    function formatTime(timestamp) {
        // Create a new JavaScript Date object based on the timestamp
        var date = new Date(timestamp);
        // Hours part from the timestamp
        var hours = date.getHours();
        // Minutes part from the timestamp
        var minutes = "0" + date.getMinutes();
        // Seconds part from the timestamp
        var seconds = "0" + date.getSeconds();

        // Will display time in 10:30:23 format
        var formattedTime = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
        return formattedTime;
    }
});