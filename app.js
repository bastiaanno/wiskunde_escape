const fs = require('fs');
const express = require('express');
const app = express();
//ONLY FOR LOCAL TESTING
const http = require('https');
const server = http.createServer({
        key: fs.readFileSync('./localhost.pem'),
        cert: fs.readFileSync('./localhost.crt'),
        ca: fs.readFileSync('./localhost-chain.pem')
    },
    app);
const { Server } = require("socket.io");
const io = new Server(server);
const port = process.env.PORT || 3000;
const passwords = JSON.parse(fs.readFileSync("passwords.json", 'utf-8'));
const questions = JSON.parse(fs.readFileSync("questions.json", 'utf-8'));
var current_question;
var current_question_num = 0;
var next_question;
var points_received = 0;
var max_points = 0;
questions.questions.forEach(question => {
    let questionPoints = question.points_reward;
    max_points += questionPoints;
});
console.log("Totaal aantal punten: " + max_points);
var turf = require('@turf/turf');
// And then use it
var features = [{
    coordinates: [
        [
            [
                6.2242377,
                52.1354242
            ],
            [
                6.2242538,
                52.1349566
            ],
            [
                6.2245864,
                52.1349566
            ],
            [
                6.2252355,
                52.1349303
            ],
            [
                6.2251979,
                52.1350949
            ],
            [
                6.2249458,
                52.1354275
            ],
            [
                6.2244898,
                52.1354472
            ],
            [
                6.2242377,
                52.1354242
            ]
        ]
    ],
    name: "isendoorn"
}]
const isValidJwt = (header) => {
    const token = header.split(' ')[1];
    if (token === 'abc') {
        console.log("Authenticatie succesvol.")
        return true;
    } else {
        return false;
    }
};

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});
app.get('/:type', (req, res) => {
    let type = req.params.type;
    if (!type.includes(".")) res.sendFile(__dirname + '/' + type + '.html');
    else res.sendFile(__dirname + '/public/' + type);
});
app.post('/hostage', function(req, res) {
    res.sendFile(__dirname + '/hostage.html');
})

app.use(express.static(__dirname + '/public'));

io.use((socket, next) => {
    const header = socket.handshake.headers['authorization'];
    if (isValidJwt(header)) {
        return next();
    }
    return next(new Error('Probleem met authenticatie.'));
});
var hostage = io.of('/hostage');
var supervisor = io.of('/super');
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
            socket.emit('redirect', '/' + type);
        } else {
            socket.emit('alert', 'Het wachtwoord is incorrect.');
        }
    });
    // start listening for coords
    socket.on('send:coords', function(data) {
        var point = turf.point([data.coords[0].lng, data.coords[0].lat]);
        var checkPos = turf.inside(point, smidse);
        if (checkPos) {
            console.log("JA, ", data.id, "is in een polygon.");
            supervisor.emit("polygon update", data.id, )
        } else {
            console.log("NEE, ", data.id, "is buiten polygon.");
        }
        // broadcast your coordinates to everyone except you
        socket.broadcast.emit('load:coords', data);
    });
    console.log('Iemand is verbonden. Welkom!');
});
hostage.on('connection', function(socket) {
    socket.on('answer', function(formData) {
        console.log(formData);
    });
    console.log('Iemand is verbonden in de geizelaar namespace.');
    if (current_question != undefined) hostage.emit('new question', current_question.question, current_question.type);
});
var chat = io.of('/chat');
chat.on('connection', (socket) => {
    socket.on('chat message', (msg, sender, timestamp) => {
        chat.emit('chat message', msg, sender, timestamp);
    });
});
supervisor.on('connection', function(socket) {
    next_question = questions.questions[current_question_num];
    socket.emit("next question", next_question.question, next_question.points_reward);
    socket.on("send new question", () => {
        current_question = questions.questions[current_question_num];
        hostage.emit("new question", current_question.question);
        console.log("Nieuwe vraag aan het versturen:\n" + current_question.question);
        console.log("Met correcte antwoord(en):");
        current_question.possibleAnswers.forEach(possibleAnswer => {
            console.log(possibleAnswer);
        });
        console.log("Deze vraag is " + current_question.points_reward + " punt(en) waard!")
    });
    var timerInterval;
    socket.on('start timer', (duration, warn, alert) => {
        io.emit('start timer', duration, warn, alert);
        supervisor.emit('start timer', duration, warn, alert);
        console.log("De timer wordt gestart!");
        var WARNING_THRESHOLD = warn * 60;
        var ALERT_THRESHOLD = alert * 60;
        var COLOR_CODES = {
            info: {
                color: "green"
            },
            warning: {
                color: "orange",
                threshold: WARNING_THRESHOLD
            },
            alert: {
                color: "red",
                threshold: ALERT_THRESHOLD
            }
        };
        var TIME_LIMIT = duration * 60;
        var timePassed = 0;
        timerInterval = setInterval(() => {
            timePassed = timePassed += 1;
            if (timePassed > TIME_LIMIT) return;
            hostage.emit("update timer", COLOR_CODES, TIME_LIMIT, timePassed, WARNING_THRESHOLD, ALERT_THRESHOLD);
            supervisor.emit("update timer", COLOR_CODES, TIME_LIMIT, timePassed, WARNING_THRESHOLD, ALERT_THRESHOLD);
        }, 1000);
    });
    socket.on('send:coords', function(data) {
        var point = turf.point([data.coords[0].lng, data.coords[0].lat]);
        //var checkPos = turf.inside(point, smidse);
        var isInPolygon = false;
        features.forEach(featureFromArray => {
            var usablePolygon = turf.polygon(featureFromArray.coordinates, { name: featureFromArray.name });
            var checkPos = turf.inside(point, usablePolygon);
            if (checkPos) {
                isInPolygon = true;
                console.log("JA, ", data.id, "is in de polygon ", featureFromArray.name);
                supervisor.emit("polygon update", "in", data.id, featureFromArray.name);
            }
        });
        if (!isInPolygon) {
            console.log("NEE, ", data.id, "is buiten een polygon");
            supervisor.emit("polygon update", "out", data.id);
        }
        // broadcast your coordinates to everyone except you
        socket.broadcast.emit('load:coords', data, "");
    });

    function stopTimer() {
        clearInterval(timerInterval);
    }
    socket.on("stop timer", function() {
        stopTimer();
        console.log("De timer is gestopt!");
    })
});

server.listen(process.env.PORT || port, () => {
    console.log('Server luistert op http://localhost:' + port);
});