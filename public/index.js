var socket = io({
    transportOptions: {
        polling: {
            extraHeaders: {
                'Authorization': 'Bearer abc',
            },
        },
    },
});
$(document).ready(function() {
    $("button").click(function() {
        socket.emit("entry_button", this.id);
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
});