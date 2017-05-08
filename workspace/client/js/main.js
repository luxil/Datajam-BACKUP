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
        {
            "name":"Block",
            "url":'sample/Block.wav',
        },
        {   
            "name":"Ride",
            "url":'sample/Ride.wav',
        },
        
    ];
var sources;
var timetext;
var quarterstext;

var timer = (function(){
    var running = false;
    var f_timeout;
    var lookahead = 25;
    var started = 0;
    
    var start = function() {
        if(running){
            stop();
        }
        running = true;
        counter.step(0); 
        started = context.currentTime;
        var loop = function(){

            //counter.tick();
            counter.schedule();
            
            //before = now;
        }
        before = context.currentTime;
        f_timeout = setInterval(loop,lookahead);
        
    }
    var stop = function() {
        running = false;
        clearInterval(f_timeout);
        counter.step(0);   
    }
    
    var getStarted = function(){
        return started;
    }
    
    var getLookahead = function(){
        return lookahead;
    }
    
    return{
        start:start,
        stop:stop,
        started:getStarted,
        lookahead:getLookahead,
    }
})()

var instrumentList;
var counter = (function(){
    var step = 0;
    var globalStep = 0;
    var scheduleAhead = 0.100; //schedule ahead in s
    var p = {};
    var next;
    
    var schedule = function(){
        var started = timer.started();
        var now = context.currentTime;
        var la = now + scheduleAhead;
        var scheduleDelta;

        // set next to started on first 
        if(!next){
            next = started;
        }
        
        if(la >= next){
            next = next + (quarter/1000);
            scheduleDelta = Math.max(next - now, 0) + now;
            tick(scheduleDelta);
        } else {
            scheduleDelta = "";
        }
        //console.log("la: " + la.toFixed(4) + " next: " + next.toFixed(4) + " started: " + started.toFixed(4) + " now: " + now.toFixed(4) 
        //+ "\nglobalStep: " + globalStep + " step: " + step + " scheduleDelta: " + scheduleDelta + " quarter: " + quarter.toFixed(4));
        
    }
    
    var tick = function(delta){
        
        $(document).trigger("tick",globalStep);
        
        step = globalStep % 8;
/*        for (var i = p.length; i--; ) {
            if(p[i][step] == 1){
                //playSound(i,0);
                playSound(i,delta);
                //console.log(delta);
            }
        }*/
        // show current step
        
        for (var id in p) {
            if (p.hasOwnProperty(id)) {
                var currentP = p[id];
                var s = globalStep % currentP.length;
                var notes = currentP[s];
                console.log(notes);
                if(instrumentList.hasOwnProperty(id)){
                    for (var i = notes.length; i--; ) {
                        var note = notes[i];
                        instrumentList[id].play(note.pitch,delta, note.hold * quarter/1000);
                    }
                }
            }
        }
        quarterstext.text(step);
        
        globalStep += 1;
        
    }
    var setStep = function(i) {
        globalStep = i;
        step = i;
        next = null;
        console.log("setStep: " + i);
    }
    
    var setPattern = function(id,newP){
        p[id] = newP;
    }
    
    return{
        tick:tick,
        step:setStep,
        setPattern:setPattern,
        schedule:schedule,
    }
    
})()

$(document).on("changePattern",function(event,data) {
    counter.setPattern(data.id,data.pattern)
    //console.log(data);
    //pianoRoll.tick(data);
});



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
            p.push(empty.slice());
        }
    }
    
    //counter.setPattern("drums",p);
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
        var i = data[0];
        var j = data[1];
        var v = p[i][j];
        //console.log(data);
        p[i][j] = ((v == 1) ? 0 : 1);
        console.log(p);  
        //draw();
        $("#b-{}-{}".format(i,j)).toggleClass("b-active");
        //renew();
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
    //if (!source.start)
    //  source.start = source.noteOn;
    //console.log(time);
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

$(document).on('click','.n',function(){
    var data = parseInt( $(this).data("index") );
    var osc = context.createOscillator();
    
    var f = 261.63*Math.pow(2,data/12);
    osc.frequency.value = f;
    
    osc.connect(context.destination);
 
    osc.start(context.currentTime);
    osc.stop(context.currentTime + quarter/1000);
});


function init() {
    
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
    
    var parent =$("#notes");
    for (var j = 0; j < 12; j++){
        var b = $("<div></div>").addClass("n").data("index",[j]).appendTo(parent); 
    }
    
}