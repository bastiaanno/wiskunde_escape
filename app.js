const fs = require('fs');
const express = require('express');
const app = express();
const http = require('http');
const server = http.Server(app);
const { Server } = require("socket.io");
const io = new Server(server);
const port = 3000;
const passwords = JSON.parse(fs.readFileSync("passwords.json", 'utf-8'));

const isValidJwt = (header) => {
    const token = header.split(' ')[1];
    if (token === 'abc') {
        return true;
    } else {
        return false;
    }
};

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});
app.get('/hostage', (req, res) => {
    res.sendFile(__dirname + '/hostage.html');
});
app.use(express.static(__dirname + '/public'));

io.use((socket, next) => {
    const header = socket.handshake.headers['authorization'];
    console.log(header);
    if (isValidJwt(header)) {
        return next();
    }
    return next(new Error('authentication error'));
});
io.on('connection', (socket) => {
    socket.on('entry_button', (type) => {
        if (type != 'hostage') {
            socket.emit('password', type);
        } else {
            socket.emit('redirect', '/hostage');
            console.log('redirecting');
        }
    });
    socket.on('password', (type, pass) => {
        if (type) {
            console.log(type);
        }
        if (!pass || pass === undefined || pass === "" || pass === null) {
            socket.emit('alert', 'voer een wachtwoord in!');
            return;
        }
        if (pass == passwords[type]) {
            socket.emit('alert', 'Het wachtwoord is juist!');
        } else {
            socket.emit('alert', 'Het wachtwoord is incorrect.');
        }
    });
    console.log('a user connected');
});
var iosa = io.of('/hostage');
iosa.on('connection', function(socket) {
    console.log('A user connected to Hostage namespace');
});
iosa.emit('stats', { data: 'some data' });

server.listen(process.env.PORT || port, () => {
    console.log('listening on http://localhost:' + port);
});
