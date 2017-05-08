

String.prototype.format = function () {
    var i = 0, args = arguments;
    return this.replace(/{}/g, function () {
        return typeof args[i] != 'undefined' ? args[i++] : '';
    });
};


function BufferLoader(context, urlList, callback) {
    this.context = context;
    this.urlList = urlList;
    this.onload = callback;
    this.bufferList = new Array();
    this.loadCount = 0;
}

BufferLoader.prototype.loadBuffer = function(url, index) {
    // Load buffer asynchronously
    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";

    var loader = this;

    request.onload = function() {
        // Asynchronously decode the audio file data in request.response
        loader.context.decodeAudioData(
            request.response,
            function(buffer) {
                if (!buffer) {
                    alert('error decoding file data: ' + url);
                    return;
                }
                loader.bufferList[index] = buffer;
                sample[index].buffer = buffer;
                if (++loader.loadCount == loader.urlList.length)
                    loader.onload(loader.bufferList);
            },
            function(error) {
                console.error('decodeAudioData error', error);
            }
        );
    }

    request.onerror = function() {
        alert('BufferLoader: XHR error');
    }

    request.send();
}

BufferLoader.prototype.load = function() {
    for (var i = 0; i < this.urlList.length; ++i){
        this.loadBuffer(this.urlList[i].url, i);
    }
}

function calcTempo() {
    return (60000 / bpm) / 4; // in ms
}

window.onload = init;
var context;
var bufferLoader;
var bpm = 120;
var quarter = calcTempo()
var sample = [
    {
        "name":"Kick",
        "url":'sample/Kick.wav',
    },
    {
        "name":"HiHat",
        "url":'sample/HiHat.wav',
    },
    {
        "name":"Closed",
        "url":'sample/Closed.wav',
    },

    {
        "name":"Snare",
        "url":'sample/Snare.wav',
    },
    {
        "name":"Bass",
        "url":'sample/Bass.wav',
    },
    /*{
     "name":"Block",
     "url":'sample/Block.wav',
     },
     {
     "name":"Ride",
     "url":'sample/Ride.wav',
     },*/

];
var sources;
var timetext;
var quarterstext;

var timer = (function(){
    var running = false;

    var start = function() {
        running = true;
        counter.step(-1);
        var loop = function(before){
            var now = context.currentTime;
            //console.log("diff:" + (now-before) + ", should:" + quarter  );

            timetext.text((now-before).toFixed(6));
            counter.tick();

            if(running){
                setTimeout(loop, quarter, now);
            }
        }
        loop(context.currentTime-quarter);

    }
    var stop = function() {
        running = false;
        counter.step(0);
    }

    return{
        start:start,
        stop:stop,
    }
})()

var counter = (function(){
    var step = 0;
    var p;

    var tick = function(){
        step = (step + 1) % 8;
        for (var i = p.length; i--; ) {
            if(p[i][step] == 1){
                playSound(i,0);
            }
        }

        quarterstext.text(step);

    }
    var setStep = function(i) {
        step = i;
    }

    var setPattern = function(newP){
        p = newP;
    }

    return{
        tick:tick,
        step:setStep,
        setPattern:setPattern,
    }

})()

var pattern = (function(){
    var p = [
        [1,0,0,0,1,0,0,0],
        [0,0,1,0,0,0,1,0],
        [1,0,0,0,0,0,1,0],
        [0,0,0,0,1,0,0,0],
    ]

    var empty = [0,0,0,0,0,0,0,0];
    if (sample.length > p.length){
        for(var i = p.length; i < sample.length; i++){
            p.push(empty);
        }
    }

    counter.setPattern(p);
    console.log(p);

    var draw = function(){
        for(var i = 0; i < p.length; i++){
            for(var j = 0; j < p[i].length; j++){
                var s = p[i][j];
                if(s == 1){
                    $("#b-{}-{}".format(i,j)).addClass("b-active");
                } else {
                    $("#b-{}-{}".format(i,j)).removeClass("b-active");
                }
            }
        }
    }

    var change = function(data) {
        var v = p[data[0]][data[1]];
        p[data[0]][data[1]] = (v + 1) % 2;
        console.log(p);
        draw();
        renew();
    }

    var renew = function(){
        //var pNew = [];
        for(var i = 0; i < p.length; i++){
            for(var j = 0; j < p[i].length; j++){
                //var s = p[i][j];
                var s = $("#b-{}-{}".format(i,j))
                if(s.hasClass("b-active") ){
                    p[i][j] = 1;
                } else {
                    p[i][j] = 0;
                }
            }
        }
        counter.setPattern(p);

    }

    var get = function(){
        return p;
    }

    return{
        draw:draw,
        change:change,
        get:get,
        renew:renew,

    }
})();

function playSound(i, time) {
    var buffer = sample[i].buffer;
    var source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    if (!source.start)
        source.start = source.noteOn;
    source.start(time);
}

function finishedLoading(bufferList) {


    for (var i = 0; i < sample.length; i++) {
        var s = sample[i];
        var b =  $("<div class='mpc-b'></div>");
        b.text(s.name)
        b.data("s-index",i);
        $("#intf").append(b);

        //console.log(b);

    }
}

$(document).on('click','.mpc-b',function(){
    var t = $(this);
    var i = parseInt( t.data("s-index") );
    //console.log(i);
    playSound(i,0);
});

$(document).on('click','.mpc-b',function(){
    var t = $(this);
    var i = parseInt( t.data("s-index") );
    //console.log(i);
    playSound(i,0);
});

$(document).on('click','.b',function(){
    var data = $(this).data("index");
    pattern.change(data);
    console.log(data);
});

$(document).on('change','#bpm',function() {
    bpm = parseInt( $(this)[0].value );
    quarter = calcTempo();

});

// socket.io handler

var socket = io();

    socket.on('start',function(){
        console.log("start");
       timer.start();

    });
    socket.on('stop',function(data){

       timer.stop();

    });
    socket.on('roomNr',function(data){
        var myRoom = parseInt(data);
        room = myRoom;
        setTimeout(function(){
            console.log(room);
        },1500);

    });
    socket.on('speed',function(data){
        console.log(data);
        var el = document.getElementById('bpm');
        if (el.value != data) {
            el.value = data;
            $(el).trigger("change");
        }
    });
    socket.on('newPattern',function(data){
       //var type = data[0];
       //var newPat = data[1];
       console.log(data);
           var p = [
        [0,1,0,1,0,1,0,0],
        [0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0],
        [0,0,0,1,0,1,0,1],
    ]
           counter.setPattern(p);
    });

function init() {
    
    var touch = 'createTouch' in document;
    if(touch){
        var w = window.innerWidth;
        var h = window.innerHeight;
        if(w>800 ||h>800){
            
        }else{
        window.location = "/";
        }
    }
    var room;

    socket.emit('createRoom');


    timetext = $("#counter");
    quarterstext = $("#quarters");

    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    context = new AudioContext();

    bufferLoader = new BufferLoader(
        context,
        sample,
        finishedLoading
    );

    bufferLoader.load();

    //console.log(sources);

    $("#start").click(function(){
        timer.start();
    })
    $("#stop").click(function(){
        timer.stop();
    })


    for (var i = 0; i < sample.length; i++) {
        var s = sample[i];
        var parent = $("<div></div>").appendTo("#steps");
        var bname = $("<div></div>").addClass("b-name").text(s.name).appendTo(parent);
        for (var j = 0; j < 8; j++){
            var b = $("<div></div>").addClass("b").data("index",[i,j]).appendTo(parent);
            b[0].id = "b-"+i+"-"+j;
        }
    }


    pattern.draw();
}
