$(document).ready(function() {
    const FULL_DASH_ARRAY = 283;
    var WARNING_THRESHOLD = 0;
    var ALERT_THRESHOLD = 0;
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
    var TIME_LIMIT = 0;
    var timePassed = 0;
    var timeLeft = TIME_LIMIT - timePassed;
    let timerInterval = null;
    let remainingPathColor = COLOR_CODES.info.color;
    var makeWhite;
    var makeRed;

    $(".timer_cd").html(`
<div class="base-timer">
  <svg class="base-timer__svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <g class="base-timer__circle">
      <circle class="base-timer__path-elapsed" cx="50" cy="50" r="45"></circle>
      <path
        id="base-timer-path-remaining"
        stroke-dasharray="283"
        class="base-timer__path-remaining ${remainingPathColor}"
        d="
          M 50, 50
          m -45, 0
          a 45,45 0 1,0 90,0
          a 45,45 0 1,0 -90,0
        "
      ></path>
    </g>
  </svg>
  <span id="base-timer-label" class="base-timer__label">${formatTime(
        timeLeft
    )}</span>
</div>
`);

    function onTimesUp() {
        clearInterval(timerInterval);
        flashRing();
    }

    function startTimer(color, duration, warning, alert) {
        stopRingFlash();
        makeGreen();
        TIME_LIMIT = duration
        WARNING_THRESHOLD = warning;
        ALERT_THRESHOLD = alert;
        timeLeft = TIME_LIMIT;
        COLOR_CODES = color;
    }

    function updateTimer(color, duration, timePassed, warn, alert) {
        TIME_LIMIT = duration
        WARNING_THRESHOLD = warn;
        ALERT_THRESHOLD = alert;
        COLOR_CODES = color;
        timeLeft = TIME_LIMIT - timePassed;
        $("#base-timer-label").html(formatTime(
            timeLeft
        ));
        setCircleDasharray();
        setRemainingPathColor(timeLeft);

        if (timeLeft === 0) {
            onTimesUp();
        }
    }

    function formatTime(time) {
        const minutes = Math.floor(time / 60);
        let seconds = time % 60;

        if (seconds < 10) {
            seconds = `0${seconds}`;
        }

        return `${minutes}:${seconds}`;
    }

    function setRemainingPathColor(timeLeft) {
        const { alert, warning, info } = COLOR_CODES;
        if (timeLeft <= alert.threshold) {
            $("#base-timer-path-remaining").removeClass(warning.color);
            $("#base-timer-path-remaining").addClass(alert.color);
        } else if (timeLeft <= warning.threshold) {
            $("#base-timer-path-remaining").removeClass(info.color);
            $("#base-timer-path-remaining").addClass(warning.color);
        }
    }

    function flashRing() {
        makeWhite = setInterval(() => {
            if (timeLeft !== 0) return;
            $("#base-timer-path-remaining").removeClass("red");
        }, 1000);
        makeRed = setInterval(() => {
            if (timeLeft !== 0) return;
            $("#base-timer-path-remaining").addClass("red");
        }, 2000);
    }

    function stopRingFlash() {
        clearInterval(makeWhite);
        clearInterval(makeRed);
    }

    function makeGreen() {
        $("#base-timer-path-remaining").removeClass("red");
        $("#base-timer-path-remaining").addClass("green");
    }

    function calculateTimeFraction() {
        const rawTimeFraction = timeLeft / TIME_LIMIT;
        return rawTimeFraction - (1 / TIME_LIMIT) * (1 - rawTimeFraction);
    }

    function setCircleDasharray() {
        const circleDasharray = `${(
            calculateTimeFraction() * FULL_DASH_ARRAY
        ).toFixed(0)} 283`;
        $("#base-timer-path-remaining").attr("stroke-dasharray", circleDasharray);
    }
    socket.on('start timer', (duration, warn, alert) => {
        startTimer(duration, warn, alert);
    });
    socket.on('update timer', (COLOR_CODES, TIME_LIMIT, timePassed, WARNING_THRESHOLD, ALERT_THRESHOLD) => {
        updateTimer(COLOR_CODES, TIME_LIMIT, timePassed, WARNING_THRESHOLD, ALERT_THRESHOLD);
    });
});