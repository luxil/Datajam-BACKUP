function client(){
    var socket = io();
    var nr = document.getElementById("nr").innerHTML;
    var startButton = document.getElementById("start");
    var stopButton = document.getElementById("stop");
    var speedInput = document.getElementById("speed");
    var patternInput = document.getElementById("pattern");
    
    var int = parseInt(nr);
    socket.emit("joinRoom",int);

    function sendStart(e){

        socket.emit('start',int);
    }
    function sendStop(e){
        socket.emit('stop',int);
    }
    function sendSpeed(e){
        socket.emit('speed',[int,"120"]);
        console.log("gesendet");
    }
    function sendPattern(e){
        socket.emit('pattern',[int,"test"]);
        console.log("pattern");
    }
    
    startButton.addEventListener("click",sendStart);
    stopButton.addEventListener("click",sendStop);
    speedInput.addEventListener("click",sendSpeed);
    patternInput.addEventListener("click",sendPattern);
    
}