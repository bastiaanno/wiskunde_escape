var socket = io('/hostage');
var chatSocket = io('/chat');
$(document).ready(function() {
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
    socket.on('new question', (question, newType) => {
        $(".question").html(question);
        $('.submit_answer').prop('disabled', false);
        $('form[name=answer]').show();
        switch (newType) {
            case "number":
                $('.answer_field_1').attr('type', "number");
                $('.answer_field_1').attr('step', "0.1");
                $('.answer_field_2').hide();
                break;
            case "vector":
                $('.answer_field_1').attr('type', "number");
                $('.answer_field_2').show();
                $('.answer_field_2').attr('type', "number");
            case "coordinates":
                $('.answer_field_1').attr('type', "number");
                $('.answer_field_1').attr('step', "0.1");
                $('.answer_field_2').show();
                $('.answer_field_2').attr('type', "number");
                $('.answer_field_2').attr('step', "0.1");
                break;
        }
        $('.answer_field').attr('type', newType);
    });
    $('form[name=answer]').on("submit", function() {
        var formData = $(this).serializeArray();
        console.log(formData);
        socket.emit("answer", formData);
        return false;
    });
    $('form[id=form]').on("submit", function() {
        return false;
    });
    socket.on('question correct', (progress) => {
        alert("Vraag is goed!");
        var elem = $("#progress_bar");
        elem.style.width = progress + "%";

    });
    var messages = document.getElementById('messages');
    var form = document.getElementById('form');
    var input = document.getElementById('input');

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        if (input.value) {
            chatSocket.emit('chat message', input.value, "Escaperoom", $.now());
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