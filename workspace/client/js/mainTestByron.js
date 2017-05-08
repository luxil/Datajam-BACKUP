var userIdList = new Array();
var infoForRow = new Array();
var pl_or_st = "play"; //play or stop 
var bassPic = "url('../img/bass.png')"
var synthPic = "url('../img/synth.png')"
var drumsPic = "url('../img/drums.png')"
var context = new AudioContext();
String.prototype.format = function () {
  var i = 0, args = arguments;
  return this.replace(/{}/g, function () {
    return typeof args[i] != 'undefined' ? args[i++] : '';
  });
};

var appendItem = function(append,options){
	//append  {classes,text,attr,tag}
	var options = options 	|| {};
   	var attr = options.attr || "";
   	var tag = options.tag 	|| "<div></div>"
   	
	var elem = $(tag,attr);
	if(options.text !== undefined){
		elem.text(options.text);
	}
	if(options.classes !== undefined){
		elem.addClass(options.classes);
	}
	if(options.data !== undefined){
		for(var k in options.data){
			elem.data(k,options.data[k]);
		}
	}
	if(typeof append === 'string'){
		if(append[0] != "#"){
			append = "#"+append;
		}
	}
	elem.appendTo(append);
	return elem;
}

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
        {   
            "name":"Tamborine",
            "url":'sample/Tamborine.wav',
        },
        {   
            "name":"Tom Low",
            "url":'sample/Tom Low.wav',
        },
        
    ];
var sources;
var timetext;
var quarterstext;

var timer = (function(){
    var running = false;
    var f_timeout;
    var lookahead = 50;
    var started = 0;
    
    var start = function() {
        if(running){
            stop();
        }
        running = true;
        counter.setStep(0); 
        started = context.currentTime;
        var loop = function(){
            
            counter.schedule();
            
        }
        before = context.currentTime;
        f_timeout = setInterval(loop,lookahead);
        
    }
    var stop = function() {
        running = false;
        clearInterval(f_timeout);
        counter.setStep(0);   
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
var Counter = function(){
    var step = 0;
    var globalStep = 0;
    var scheduleAhead = 0.200; //schedule ahead in s
    var p = {};
    var next;
    
    Counter.prototype.schedule = function(){
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
            Counter.prototype.tick(scheduleDelta);
        } else {
            scheduleDelta = "";
        }
        //console.log("la: " + la.toFixed(4) + " next: " + next.toFixed(4) + " started: " + started.toFixed(4) + " now: " + now.toFixed(4) 
        //+ "\nglobalStep: " + globalStep + " step: " + step + " scheduleDelta: " + scheduleDelta + " quarter: " + quarter.toFixed(4));
        
    }
    
    Counter.prototype.tick = function(delta){
        
        $(document).trigger("tick",globalStep);
        
        step = globalStep % 8;
        
        for (var id in p) {
            if (p.hasOwnProperty(id)) {
                var currentP = p[id];
                var s = globalStep % currentP.length;
                var notes = currentP[s];
                //console.log(notes);
                if(instrumentList.hasOwnProperty(id)){
                    for (var i = notes.length; i--; ) {
                        var note = notes[i];
                        instrumentList[id].play(note.pitch,delta, note.hold * quarter/1000);
                    }
                }
            }
        }
        //quarterstext.text(step);
        
        globalStep += 1;
        
    }
    Counter.prototype.setStep = function(i) {
        globalStep = i;
        step = i;
        next = null;
        console.log("setStep: " + i);
    }
    
    Counter.prototype.setPattern = function(id,newP){
        p[id] = newP;
    }
    
    /*return{
        tick:tick,
        step:setStep,
        setPattern:setPattern,
        schedule:schedule,
    }*/
}    
//})()

var counter = new Counter();

$(document).on("changePattern",function(event,data) {
    counter.setPattern(data.id,data.pattern)
});

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
 
/*    for (var i = 0; i < sample.length; i++) {
        var s = sample[i];
        var b =  $("<div class='mpc-b'></div>");
        b.text(s.name)
        b.data("s-index",i);
        $("#intf").append(b);

    }*/
}


$(document).on('change','#bpm',function() {
    bpm = parseInt( $(this)[0].value );
    quarter = calcTempo();
    
});

$(document).on("tick",function(event,data) {
    $(".tick-box").removeClass("tick-active");
    $(".tick-box-"+(parseInt(data)%16)).addClass("tick-active");
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
    
    for(var i = 0; i < 16; i++){
        appendItem($("#tick-viewer"),{"classes":"tick-box tick-box-{}".format(i)});
    }
      
    //console.log(sources);
    
    $("#start").click(function(){
        timer.start();
        changePlayStop("start");
    })
    $("#stop").click(function(){
        timer.stop();
        changePlayStop("stop");
    })
    
    $(".playbutton").click(function() {
        changePlayStop(pl_or_st);
    })
    //zum testen
    $("#changePlayStop").click(function(){
        changePlayStop(pl_or_st);
    })
    $("#addUserHost").click(function(){
    addUserToHost("testIns", 'red');
    })
    $("#deleteUserHost").click(function(){
        deleteUserFromHost(-1);
    })
    $("#newTable").click(function(){
        refreshTable();
    })
    
}

function addUserToHost(instrument, color,id){
    //console.log("addUser");

    //var newElement = "<tr id='row_id_"+ id +  "'><td class='instrumentth'>" + instrument + '<img src="../img/close.png">' + "</td></tr>";
    //var userListHost = document.getElementById("userListHost");
    //userListHost.innerHTML += newElement;
    //$("#userListHost").append(newElement);
    //$("#row_id_"+String(id)).css({"background-color":"hsla({},100%,70%)".format(color)});
    //newElement = "<p>test</p>";
    //$("#row_id_"+String(id)).append("<td id='rowNrHost_" + (userIdList.length-1) +"'></td>");
    //var list = $("#userListHost");
    var insPic = "url('../img/PlaybuttonWebaudio.png')";
    
    var icons = {
        "bass":"../img/bass.png",
        "drums":"../img/drums.png",
        "synth":"../img/synth.png",
    }
    var icon = icons[instrument];
    
    var height = $(window).innerHeight()/8;
    
    var parent = appendItem("#userListHost",{"classes":"user-wrapper"});
    parent.css({"background-color":"hsla({},100%,70%)".format(color),"height":height});
    //appendItem(parent,{"classes":"user-instrument","text":instrument,"attr":{"id":"userIns-"+id}}).css({"line-height":height+"px","font-size":height/4+"px","background-image":insPic});
    appendItem(parent,{"classes":"user-instrument","text":instrument,"attr":{"id":"userInsText-"+id}}).css({"line-height":height+"px","font-size":height/3+"px"});
    appendItem(parent,{"tag":"<img>","classes":"user-icon","attr":{"src":icon,"id":"userInsIcon-"+id}}).css({"height":height});
    appendItem(parent,{"tag":"<canvas>","classes":"user-analyser","attr":{"id":"analyser-"+id,"width":height,"height":height}});
    //$("#rowNrHost_"+String((userIdList.length-1))).append("test");
    
    
}///

function deleteUserFromHost(userid){
    //$("#userIns-" + userid).parent.unwrap();
    $("#userInsIcon-" + userid).unwrap();
    $("#userInsIcon-" + userid).remove();
    $("#userInsText-" + userid).remove();
    $("#analyser-"+userid).remove();
    //console.log("deleteUser " + userid);
    /*
    var userListHost = document.getElementById("userListHost");
    var rowNr = -1;
    
    if (userid===-1){
        rowNr = 0;
    }else {
        var index = userIdList.indexOf(userid);
        if(index>-1){
            rowNr = index;
            userIdList.slice(index, 1);
        }
    }
    if(rowNr!=-1){
        userListHost.deleteRow(rowNr);
    }
    */
}

function changePlayStop(action){
    //console.log("changePlayStop");
    $(document).trigger("changePlay",action);
    if(action==="play") {
        //$(".playbutton").css({"background-image":"url('../img/PlaybuttonWebaudio.png')"});
        $(".play-icon").fadeOut(200,function(){
            $(".stop-icon").fadeIn(200);
        });
        timer.start();
        pl_or_st = "stop";
    }else if(action==="stop"){
        $(".stop-icon").fadeOut(200,function(){
            $(".play-icon").fadeIn(200);
        });
        //$(".playbutton").css({"background-image":"url('../img/StopbuttonWebaudio.png')"});
        timer.stop();
        pl_or_st = "play";
    }    
}
function refreshTable(){
    /*
    $("#userListHost tr").remove();
    console.log("userIdList: " + userIdList);
    if(userIdList.length!=0){
        for(var i= 0; i <userIdList.length; i++ ){
            var id = userIdList[i];
            var instrument = infoForRow[i].instrument; 
            var color = infoForRow[i].colorUser;
            $("#userListHost").append("<tr id='row_id_"+ id +  "'></tr>" );
            $("#row_id_"+String(id)).css({"background-color":"hsla({},100%,70%)".format(color)});
            $("#row_id_"+String(id)).append("<td class='instrumentth'>" + instrument + '<img src="../img/close.png">' + "</td>");
            $("#row_id_"+String(id)).append("<td id='rowNrHost_" + i +"'></td>");
            $("#rowNrHost_"+String(i)).append("<div class='prHostContainer' id='prHost_" + i +"'>");
            $("#prHost_"+i).append('<div class = "prHost-hist pr-hw">' + '</div>');
            for(var col = 0; col <16; col++){
                //prHost_column_row
                ///////
                ////////
                /////
                $("#prHost_"+i).append("<div class ='prHost pr-nw pr-c" + i +" pr-cc' id='prHost-" + col + "-"+ i + "'></div>");
                //$("#prHost_"+String(i)).append('<div id="prHost-' + col + '-'+ i + 't' + '</div>');
                //" class="pr-note pr-nw pr-c1 pr-cc" style="top: 0px; left: 178.063px; width: 62.5625px; height: 73.3333px;"></div>');
            }
            $("#rowNrHost_"+String(i)).append("</div>");
        }
    }
    */
}

function updateInstrument(id, instrument){
    //console.log("userIns_"+id);
    //console.log(instrument);
    //$("#userIns-" + id).attr({"text":instrument});
    /*var insPic;
    if(instrument==="bass"){
        insPic = bassPic;
    }
    else if(instrument==="synth"){
        insPic = synthPic;
    }
    else if(instrument==="drums"){
        insPic = drumsPic;
    }*/
    var icons = {
        "bass":"../img/bass.png",
        "drums":"../img/drums.png",
        "synth":"../img/synth.png",
    }
    var icon = icons[instrument];

    var height = $(window).innerHeight()/8;
    $("#userInsText-" + id).text(instrument);
    $("#userInsIcon-" + id).attr({"src":icon});
}


$(document).on("newUser",function(event,data){
   // hier koennte der userevent hin 
        //console.log("updateUsersHostdata color: ");
        //console.log(data.colorUser);
        //console.log("userid: ");
        //console.log(data.id);
        //console.log(userIdList);
        //UserID existiert schon
        var tempIndex = userIdList.indexOf(data.id);
        if(tempIndex > -1 ){
            //deleteUserFromHost(data.id);
            //addUserToHost(data.instrument, data.colorUser,data.id);
            //infoForRow[tempIndex]={"instrument": data.instrument, "colorUser": data.colorUser};
            //refreshTable();
            updateInstrument(data.id, data.instrument);
        }else{          //UserID existiert noch nicht
            //console.log("new User");
            userIdList.push(data.id);
            //infoForRow.push({"colorUser": data.colorUser, "instrument": data.instrument});
            addUserToHost(data.instrument, data.colorUser,data.id);
        }
        /*
        for (var i = 0; i< infoForRow.length; i++){
            console.log("infoForRow[i].instrument" + infoForRow[i].instrument);
        }
        */
});
$(document).on("deleteUser",function(event,data){
   // hier koennte der userevent hin 
        //console.log("hier soll deleted werden mit ");
        //console.log(data);
        deleteUserFromHost(data.id);
});

$(document).on("startEvent",function(event,data){
        timer.start();
        changePlayStop(pl_or_st);
})
