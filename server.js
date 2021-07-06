const fs = require('fs');
const express = require('express');
const app = express();
//ONLY FOR LOCAL TESTING
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const port = process.env.PORT || 3000;
const passwords = JSON.parse(fs.readFileSync("passwords.json", 'utf-8'));
const questions = JSON.parse(fs.readFileSync("questions.json", 'utf-8'));
var authenticated = false;
var current_question;
var currentFollowUp;
var currentFollowUpTarget;
var current_question_num = 0;
var current_possible_answers = [];
var next_question;
const isValidJwt = (header) => {
    const token = header.split(' ')[1];
    if (token === 'abc') {
        console.log("We hebben een beveiligde verbinding.")
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
var control = io.of('/control');
var logger = io.of('/logger');
io.on('connection', (socket) => {
    socket.on('entry_button', (type) => {
        if (authenticated) {
            socket.emit('redirect', '/hostage');
            console.log('redirecting');
            return;
        }
        if (type == "hostage") {
            socket.emit("password", type);
            return;
        }
        if (type == "super") {
            socket.emit("password", type);
            return;
        }
        socket.emit("alert", "Wacht op escaperoom");
    });
    socket.on('password', (type, pass) => {
        if (!pass || pass === undefined || pass === "" || pass === null) {
            socket.emit('alert', 'voer een wachtwoord in!');
            return;
        }
        console.log(type);
        if (pass == passwords[type]) {

            socket.emit('redirect', '/' + type);
            authenticated = true;
            console.log("Het wachtwoord is correct!");
        } else {
            socket.emit('alert', 'Het wachtwoord is incorrect.');
        }
    });
    console.log('Iemand is verbonden. Welkom!');
});
hostage.on('connection', function(socket) {
    socket.on('answer', function(formData) {
        checkAnswer(formData, "hostage");
    });
    console.log('Iemand is verbonden in de gijzelaar namespace.');
    if (current_question != undefined) hostage.emit('new question', current_question.question, current_question.type);
});
var chat = io.of('/chat');
chat.on('connection', (socket) => {
    socket.on('chat message', (msg, sender, timestamp) => {
        chat.emit('chat message', msg, sender, timestamp);
    });
});
supervisor.on('connection', function(socket) {
    socket.emit("clear questions");
    questions.questions.forEach(question => {
        socket.emit("list question", question);
    });
    socket.emit("start listening");
    socket.on("send new question", (id) => {
        current_question = questions.questions[id - 1];
        hostage.emit("new question", current_question.question, current_question.type);
        console.log("Nieuwe vraag aan het versturen:\n" + current_question.question);
        switch (current_question.type) {
            case "vector":
                console.log("Met kentallen:");
                current_possible_answers = current_question.kentallen;
                current_possible_answers.forEach(kentalPaar => {
                    console.log(kentalPaar);
                });
                break;
            case "coordinates":
                console.log("Met coordinaten:");
                current_possible_answers = current_question.coordinates;
                current_possible_answers.forEach(coordinaatPaar => {
                    console.log(coordinaatPaar);
                });
                break;
            case "number":
                console.log("Met correct(e) antwoord(en):");
                current_possible_answers = current_question.possibleAnswers;
                current_possible_answers.forEach(possibleAnswer => {
                    console.log(possibleAnswer);
                });
                break;
        }
        console.log("////");

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

function nextQuestion() {
    current_question_num++;
    if (questions.questions[current_question_num] != undefined) {
        current_question = questions.questions[current_question_num];
        hostage.emit("new question", current_question.question);
        console.log("Nieuwe vraag aan het versturen:\n" + current_question.question);
        console.log("Met kentallen:");
        current_possible_answers = current_question.possibleAnswers;
        current_possible_answers.forEach(possibleAnswer => {
            console.log(possibleAnswer);
        });
    } else {
        console.log("Dit was de laatste vraag!");
        //END QUIZ
    }
}

function sendFollowUp() {
    control.emit("new question", "Tel de volgende vectoren bij elkaar op!", "text");

}

function sendVector(vector) {
    control.emit("new vector", vector);
}

function checkAnswer(formData, instance) {
    if (formData.length > 1) {
        var formElements = [];
        formData.forEach(formElement => {
            formElements.push(parseFloat(formElement.value));
        });
    }
    if (current_possible_answers.length > 0) {
        current_possible_answers.forEach(possibleAnswer => {
            switch (current_question.type) {
                case "vector":
                    if (checkArrays(formElements, possibleAnswer)) {
                        console.log(formElements);
                        console.log("is correct!");
                        if (current_question.followup.doFollowup) {
                            sendFollowUp();
                        } else {
                            sendVector();
                            nextQuestion();
                        }
                    } else {
                        //io.of('/' + instance).emit("alert", "Het antwoord is incorrect!");
                    }
                    break;

                case "coordinates":
                    if (checkArrays(formElements, possibleAnswer)) {
                        console.log(formElements);
                        console.log("is correct!");
                        if (current_question.followup.doFollowup) {
                            sendFollowUp();
                        } else {
                            sendVector();
                            nextQuestion();
                        }
                    } else {
                        console.log("nee");
                        //io.of('/' + instance).emit("alert", "Het antwoord is incorrect!");
                    }
                    break;

                case "number":
                    if (formData[0].value == possibleAnswer) {
                        console.log(formData[0].value + " is correct!");
                    }
                    break;
            }
        });
    } else {
        console.log("er staat nu geen vraag open.");
    }
}

function checkArrays(arrA, arrB) {

    //check if lengths are different
    if (arrA.length !== arrB.length) return false;

    //slice so we do not effect the orginal
    //sort makes sure they are in order
    var cA = arrA.slice().sort();
    var cB = arrB.slice().sort();

    for (var i = 0; i < cA.length; i++) {
        if (cA[i] !== cB[i]) return false;
    }

    return true;

}