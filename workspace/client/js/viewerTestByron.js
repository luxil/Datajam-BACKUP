String.prototype.format = function () {
  var i = 0, args = arguments;
  return this.replace(/{}/g, function () {
    return typeof args[i] != 'undefined' ? args[i++] : '';
  });
};

//var supportTouch = $.support.touch,
var supportTouch = true,
scrollEvent = "touchmove scroll",
touchStartEvent = supportTouch ? "touchstart" : "mousedown",
touchStopEvent = supportTouch ? "touchend" : "mouseup",
touchMoveEvent = supportTouch ? "touchmove" : "mousemove";
$.event.special.swipeupdown = {
    setup: function() {
        var thisObject = this;
        var $this = $(thisObject);
        $this.bind(touchStartEvent, function(event) {
            var data = event.originalEvent.touches ?
                    event.originalEvent.touches[ 0 ] :
                    event,
                    start = {
                        time: (new Date).getTime(),
                        coords: [ data.pageX, data.pageY ],
                        origin: $(event.target)
                    },
                    stop;

            function moveHandler(event) {
                if (!start) {
                    return;
                }
                var data = event.originalEvent.touches ?
                        event.originalEvent.touches[ 0 ] :
                        event;
                stop = {
                    time: (new Date).getTime(),
                    coords: [ data.pageX, data.pageY ]
                };

                // prevent scrolling
                if (Math.abs(start.coords[1] - stop.coords[1]) > 10) {
                    event.preventDefault();
                }
            }
            $this
                    .bind(touchMoveEvent, moveHandler)
                    .one(touchStopEvent, function(event) {
                $this.unbind(touchMoveEvent, moveHandler);
                if (start && stop) {
                    if (stop.time - start.time < 1000 &&
                            Math.abs(start.coords[1] - stop.coords[1]) > 30 &&
                            Math.abs(start.coords[0] - stop.coords[0]) < 75) {
                        start.origin
                                .trigger("swipeupdown")
                                .trigger(start.coords[1] > stop.coords[1] ? "swipeup" : "swipedown");
                    }
                }
                start = stop = undefined;
            });
        });
    }
};
$.each({
    swipedown: "swipeupdown",
    swipeup: "swipeupdown"
}, function(event, sourceEvent){
    $.event.special[event] = {
        setup: function(){
            $(this).bind(sourceEvent, $.noop);
        }
    };
});

/*$('#mydiv').on('swipedown',function(){alert("swipedown..");} );
$('#mydiv').on('swipeup',function(){alert("swipeup..");} );
*/
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

var PianoRoll = function(){
    var id;
    var elem;
    var container;
    var height;
    var width;
    var noteHeight;
    var noteWidth;
    var histWidth;
    var histFact = 1.5;   //history scale relative to note width 
    var numCol = 8;     //number of Coloumns
    var numRow = 16;    //number of Rows
    var patternLength = 16;
    var prefix = "pr";
    
    //88 range: A0 - C8 | midi 9 - 96
    var range = 88;
    var lowest = 9;
    var root = 69;
    var position = 0;
    
    /*var names = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
    var color = ["w","b" ,"w","b" ,"w","w","b" ,"w","b" ,"w","b" ,"w"];
    */
    
    var names;
    var color;
    var type;
    
    var types = {
        "synth":{
            "names":["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"],
            "color":["w","b" ,"w","b" ,"w","w","b" ,"w","b" ,"w","b" ,"w"],
        },
        
        "drums":{
            "names":[],
            "color":["w","w" ,"w","w" ,"w","w","w" ,"w","w" ,"w","w" ,"w"],
        } 
    };
    //note format { pitch: int note, hold: float factor }
    var currentPattern = 0;
    this.patternCount = 9;
    var patterns = [];
    
    //var pattern = [
   /*     [{"pitch":56,"hold":1}],[{"pitch":66,"hold":1}],[{"pitch":56,"hold":2}],[],
        [{"pitch":59,"hold":3}],[],[],[],
        [],[],[{"pitch":65,"hold":1}],[],
        [{"pitch":61,"hold":2}],[{"pitch":65,"hold":2}],[],[]*/
    //];
    
    var pattern = function(){
        return patterns[currentPattern];
    }
    
    this.setCurrent = function(i){
        currentPattern = i;
        $(document).trigger("changePattern",{"id":id,"pattern":patterns[currentPattern]});
    }
    
    this.getCurrent = function(){
        return currentPattern;
    }
    
    var calcPattern = function(p){
        var n = {};
        for(var i = 0; i < p.length; i++){
            var a = p[i];
            if(a){
                //itarate notes as v in array
                for(var h = 0; h < a.length; h++){
                    var note = a[h];
                    if(!n.hasOwnProperty(note.pitch)){
                        n[note.pitch] = [];
                    }
                    n[note.pitch].push({"index": i, "hold": note.hold});
                }
            }
        }
        return n;
    }
    
    this.calcHints = function(){
        var n = {"up":[],"down":[]};
        var viewMax = root + ( position      * numRow);
        var viewMin = root + ((position - 1) * numRow);
        
        console.log("viewMax " + viewMax + " viewMin " + viewMin);
        
        for(var i = 0; i < patterns[currentPattern].length; i++){
            var a = patterns[currentPattern][i];
            if(a.length > 0){
                //itarate notes as v in array
                for(var h = 0; h < a.length; h++){
                    var note = a[h];
                    if(!n.hasOwnProperty(note.pitch)){
                        if(note.pitch > viewMax){
                            n.up.push(1);
                            n.down.push(0);
                        } else if( note.pitch < viewMin){
                            n.down.push(1);
                            n.up.push(0);
                        } else {
                            n.up.push(0);
                            n.down.push(0);
                        }
                    } 
                }
            } else {
                n.up.push(0);
                n.down.push(0);
            }
        }
        return n;
    }
    
    var toggleNote = function(n,i){
        console.log(currentPattern);
        var a = patterns[currentPattern][i];
        //console.log(a);
        var exists = false
        var eindex;
        for(var i = 0; i < a.length; i++){
            var note = a[i];
            if(note.pitch == n){
                exists = true;
                eindex = i;
            }
        }
        
        if(exists){
            a.splice(eindex,1);
        } else {
            a.push({"pitch":n,"hold":1});
        }
    }
    
    this.init = function(element,description,userId,pre){
        if(typeof pre !== "undefined") {prefix = pre;}
        id = userId;
        elem = element;
        type = description.type;
        if(types.hasOwnProperty(type)){
            names = types[type].names;
            if(description.hasOwnProperty("names")){
                
                names = description.names;
                root = names.length -1 ;
                lowest = 0;
                range = names.length;
                numRow = names.length;
                
                console.log(names);
            }
            color = types[type].color;
        }
        
        //$(".pr-active").remove();
        elem.empty()
        
        height = elem.parent().innerHeight();
        width =  elem.parent().innerWidth();
        
        elem.css({"height":height,"width":width});
        
        histWidth = (width / numCol) * histFact;
        noteHeight = height / numRow;
        noteWidth = (width - histWidth) / numCol;
        container = $("<div id='"+prefix+"-container'></div>");
        elem.append(container);
        
        for(var i = 0; i < this.patternCount; i++){
            patterns.push(new Array())
            for(var j = 0; j < patternLength; j++){
                patterns[i].push(new Array());
            }
        }
        console.log("width: " + width + " height: " + height + "\nnoteHeight: " + noteHeight + " noteWidth: " + noteWidth);
        
        console.log(patterns[currentPattern]);
        $(document).trigger("changePattern",{"id":id,"pattern":patterns[currentPattern]});
    }
    
    this.draw = function(offset){
        
        if(typeof offset == "undefined" ){
            container.empty();
        }
        
        var offset = offset || 0;
        
        if ($("#piano-roll").is(':empty')){
            $("#piano-roll").replaceWith(elem);
        }
        
        var offsetTop = $("#piano-roll").position().top;
        var p = calcPattern(patterns[currentPattern]);
        for(var r = 0; r < numRow; r++ ){
            var top  = (r - offset) * noteHeight;
            var note = root - r + offset;
            
            if(note >= lowest && note < lowest + range){
            
                var noteInt = note % 12;
                //var octave = Math.floor(note/12);
                var octave = ((type == "synth") ? Math.floor(note/12) : "");
                var noteName = names[noteInt]+octave;
                var histClass = "pr-h"+color[noteInt];
                
                var history = appendItem(container,{"classes":"pr-hist " + histClass, "text":noteName});
                history.css({"top":top,"left":0, "width": histWidth, "height": noteHeight, "line-height": noteHeight +"px"});
                
                var hasNote = p.hasOwnProperty(note);
                
                for(var c = 0; c < patternLength; c++){
                    var left = c * noteWidth + histWidth;
                    var thisWidth = noteWidth;
                    
                    var noteClass = "pr-n"+color[noteInt] + " pr-c" + c;
                    var cc = 4;
                    if(Math.floor((c%(cc*2))/(cc)) == 0){
                        noteClass += " pr-cc ";
                    }
                    if(hasNote){
                        for(var i = 0; i < p[note].length; i++){
                            
                            if(p[note][i].index == c){
                                noteClass += " pr-active";
                                if(p[note][i].hasOwnProperty("hold")){
                                    thisWidth *= p[note][i].hold;
                                }
                            }
                            
                        }
                        
                    }
                    
                    var noteElem = appendItem(container,{   "classes":"pr-note " + noteClass,
                                                            "data":{"index":[c,note],"id":id},
                                                            "attr":{"id":"{}-{}-{}".format(prefix,c,note)}
                                                        });
                    noteElem.css({"top":top,"left":left, "width": thisWidth, "height": noteHeight});
    
                }
            }
        }   
    }
    // direction: 1 -> up   -1 -> down
    this.move = function(direction){
        
        
        var maxUp   =   Math.ceil(  (lowest + range - root - 1) / numRow );
        var maxDown = - Math.floor( (root - lowest) / numRow );
        
        //console.log("maxDown " + maxDown + " maxUp"  +maxUp);
        
        if(position + direction <= maxUp && position + direction >= maxDown){
        
            position = position + direction;
            
            var containerOld = container.children();
            this.draw(position * numRow);
            container.css({"top": position * numRow * noteHeight})
            setTimeout(function(){
                containerOld.remove();
            },2000);
        }
    }
    
    this.getPattern = function(){
        return patterns[currentPattern];
    }
    
    this.setPattern = function(p){
        patterns[currentPattern] = p;
        this.draw();
        $(document).trigger("changePattern",{"id":id,"pattern":patterns[currentPattern]});
    }
    
    this.change = function(data) {
        var c = data[0];    
        var n = data[1];
        toggleNote(n,c)
        var t = $("#{}-{}-{}".format(prefix,c,n));
        if(t.hasClass("pr-active")){
            t.width(noteWidth);
        }
        t.toggleClass("pr-active");
        $(document).trigger("changePattern",{"id":id,"pattern":patterns[currentPattern]});
    }
    
    this.tick = function(step){
        $(".pr-note").removeClass("pr-current");
        var s = step % patternLength;
        var noteClass = ".pr-c" + s;
        $(noteClass).addClass("pr-current");
    }
    
}

var socket;
var info = {};

var Interface = (function(){
    
    var interfaceElement; 
    var full;
    var top;
    var bottom;
    var overlay;
    var overlayTimeout;
    //var height;
    //var width;
    var half;
    var topRatio = 0.15;
    
    var init = function(){
        
        
        interfaceElement = $("#interface");
        interfaceElement.empty();
        full    = appendItem(interfaceElement,{"classes":"interface i-full",attr:{"id":"interface-full"}});
        top     = appendItem(interfaceElement,{"classes":"interface i-half",attr:{"id":"interface-top"}});
        bottom  = appendItem(interfaceElement,{"classes":"interface i-half",attr:{"id":"interface-bottom"}});
        this.height = $("body").innerHeight();
        this.width  = $("body").innerWidth();
        
        
        
        full.css({"top":0,"left":0, "width": this.width, "height": this.height});
        top.css({"top":0,"left":0, "width": this.width, "height": this.height*topRatio});
        bottom.css({"top":this.height*topRatio,"left":0, "width": this.width, "height": this.height*(1-topRatio)});
        
        half = $(".i-half");
        
        console.log("init interface");
    }
    
    var prepare = function(layerName){
        if(layerName == "top"){
            top.empty();
            half.show();
            full.hide();
        } else if(layerName == "bottom"){
            bottom.empty();
            full.hide();
            half.show();
        } else if(layerName == "full"){
            full.empty();
            half.hide();
            full.show();
        }
    }
    
    var active = function(navClass){
        $(".nav-icon").removeClass("nav-active");
        $("."+navClass).addClass("nav-active");
    }
    
    var overlayTop = function(msg){
        //var overlay = appendItem("#interface-top",{"classes":"top-overlay","text":msg});
        overlay.text(msg);
        overlay.show();
        clearTimeout(overlayTimeout);
        overlayTimeout = setTimeout(function(){
            overlay.fadeOut(200);
        },500);
    }
    
    var draw = function(intfName){
        
        if(intfName == "login"){
            prepare("full");
            appendItem(full,{"tag":"<input/>","classes":"login-bar", "attr":{"id":"login-num","type":"text","placeholder":"Enter Room Number"}});
            appendItem(full,{"text":"Connect","classes":"login-bar","attr":{"id":"login-connect"}});
            for(var i = 1; i < 13; i++){
                var text = i;
                var data = i;
                if(i == 10){
                    text = "clear";
                } else if(i == 11){
                    text = "0";
                    data = 0;
                } else if(i == 12){
                    text = "clear all";
                }
                appendItem(full,{"classes":"login-button","text":text,"data":{"index":data}})
            }
        } else if(intfName == "instrumentSelection"){ 
            prepare("full");
            // get instrument names by info keys
            var instruments = Object.keys(info);
            appendItem(full,{"text":"Select an instrument","classes":"instTitle"});
            for(var i = 0; i < instruments.length; i++){
                appendItem(full,{"text":instruments[i],"classes":"instSelect","data":{"value":instruments[i]}});
            }
        }  else if(intfName == "navigation"){ 
           prepare("top");
           appendItem(top,{"classes":"nav-icon nav-1","data":{"value":"pianoRoll"}}).css({"background-image":"url('img/notes.png')"});
           appendItem(top,{"classes":"nav-icon nav-2","data":{"value":"sound"}}).css({"background-image":"url('img/sound.png')"});
           appendItem(top,{"classes":"nav-icon nav-3","data":{"value":"patterns"}}).css({"background-image":"url('img/pattern.png')"});
           appendItem(top,{"classes":"nav-icon nav-4","data":{"value":"instrumentSelection"}}).css({"background-image":"url('img/close.png')"});
           $(".nav-icon").css({"line-height":$(".nav-icon").innerHeight()*1.7 +"px"});
           overlay = appendItem(top,{"classes":"top-overlay"});
           overlay.css({"height":this.height*topRatio});
           overlay.hide();
           active("nav-1");
           
        }  else if(intfName == "pianoRoll"){ 
            prepare("bottom");
            active("nav-1");
            appendItem(bottom,{"attr":{"id":"piano-roll"}});
            if(!$.isEmptyObject(pr)){
                pr[Object.keys(pr)[0]].move(0);
            }
        } else if(intfName == "sound"){
            prepare("bottom");
            active("nav-2");
            appendItem(bottom,{"attr":{"id":SliderController.parent.slice(1)}});
            SliderController.draw({"width":this.width,"height":this.height});    
            /*appendItem(bottom,{});
            for(i = 0; i < 2; i++){
                appendItem(bottom,{ "tag":"<input/>","classes":"controller",
                                    "attr":{"type":"number","min":"0","max":"1","step":"0.1","value":"0.5"},
                                    "data":{"index":i}
                });
            }*/
        } else if(intfName == "patterns"){
            prepare("bottom");
            active("nav-3");
            $(".patternButton").removeClass("pB-active");
            for(var i = 0; i  < Pattern.patternCount; i++){
                var pB = appendItem(bottom,{"classes":"patternButton","text":i,"data":{"index":i}});
                appendItem(pB,{"classes":"patternBorder"});
                appendItem(pB,{"classes":"patternPlay"});
                var margin = 0.2;
                var max = (Math.min(this.width,this.height)*(1-margin))/3;
                pB.css({"width":max +"px","height":max+"px","margin":this.width*margin/6+"px"});
                if(i == pr[Object.keys(pr)[0]].getCurrent() ){
                    pB.addClass("pB-active");
                }
            }
        }
        else {
            console.log("no interface with the name: " + intfName);
        }
        
    }
    
    return {
        init:init,
        draw:draw,
        overlayTop:overlayTop,
    }
})();

var Pattern = (function(){
    var current = 0;
    var patternCount = 9;
    var patterns = [];
    
    for (var i = 0; i < patternCount; i++){
        patterns.push(new Array());  
    };
    
    var setPattern = function(p){
        patterns[current] = p;
    }
    
    var getPattern = function(i){
        current = i;
        return patterns[i];
    }
    
    return{
        current:current, patterns:patterns, patternCount:patternCount,
        setPattern:setPattern,getPattern:getPattern,
        
    }
        
})();

var Slider = function(num,name,level){
    level = level || 0;
    this.level = level;
    this.num = num;
    this.name = name;
    
    var elem = "slider-"+num;
    var id = "#"+elem;
    var margin = 0.2;
    var mark = 0.05;
    var border = 5;
    
    var min = 0;
    var max = 1;
    
    var active = true;
    var cooldown = 100;
    
    this.change = function(diff){
        this.level = Math.max(Math.min(this.level+diff,max),min);
        this.draw();
        Interface.overlayTop(this.name + ": " + Math.round(this.level*100));
        if(active){
            active = false;
            console.log(this.name + ": "+this.level);
            $(document).trigger("control",{"control":this.num   ,"level":this.level});
            setTimeout(function(){
                active = true;
            },cooldown)
        }
    }
    
    this.draw = function(){
        $(id).css({"transform":"rotate("+(((this.level*0.8) - 0.4)*360)+"deg)"});
        //$("#slider1-value").text(parseFloat(this.level).toFixed(2));
    }
    
    this.init = function(){
        var size = SliderController.size*(1-margin);
        var w = appendItem(SliderController.parent,{"classes":"slider-wrapper"});
        var s = appendItem(w,{"classes":"slider","attr":{"id":elem},"data":{"object":this}});
        s.css({"width":size+"px","height":size+"px","margin":SliderController.size*margin/2+"px","border-width":border});
        var sMark = appendItem(s,{"classes":"sliderMark"});
        sMark.css({"width":size*mark+"px","height":(size*0.5)-border+"px","margin-left":(size*0.5)-(size*mark/2)-border+"px"});
        appendItem(w,{"classes":"slider-text","text":this.name});
        this.draw();
    }
    
    this.get = function(){
        return id;
    }
    
}

var SliderController = (function(){
    
    var y = 0;
    var start = 0;
    var scale = 500;
    var preset = [/*  {"name":"Filter","value":0.5},
                    {"name":"Resonance","value":0.8},
                    {"name":"Level","value":0.2},
                    {"name":"Q","value":0.5}*/    ];
    var self = this;
    var slider = [];
    var parent = "#slider-container";
    var size;
    
    var setPreset = function(p){
        preset = p;
        console.log("this preset " + preset);
        this.slider = [];
    }
    
    var draw = function (a) {
        $(parent).empty();
        this.size  = a.width/2;
        this.scale = a.height;
        //this.slider = [];
        if(this.slider.length == 0){
            for (var i = 0; i < preset.length;  i++ ) {
                this.slider.push(new Slider(i,preset[i].name,preset[i].value));
            }
        }
            
        for (var i = 0; i < this.slider.length;  i++ ) {
            this.slider[i].init();
        }
    }
    
    return{
        y:y, start:start, scale:scale, parent:parent, size:size, slider:slider,
        draw:draw, setPreset:setPreset,
    }
})();

$(document).on("touchstart",".slider",function(e){
    var touch = e.originalEvent.changedTouches[0];
    //console.log(touch);
    SliderController.start = parseInt(touch.clientY);
    e.preventDefault();
});

$(document).on("touchmove",".slider",function(e){
    var touch = e.originalEvent.changedTouches[0];
    var o = $(this).data("object");
    //console.log(touch);
    SliderController.y = -(parseInt(touch.clientY) - SliderController.start);
    SliderController.start = parseInt(touch.clientY);
    //console.log(o);
    //slider.change(sliderY/touchScale)
    o.change(SliderController.y/SliderController.scale);
    e.preventDefault();
})

$(document).on("touchend",".slider",function(e){
    var touch = e.originalEvent.changedTouches[0];
    //console.log(sliderY);

    e.preventDefault();
})
    


$(document).on("click",".instSelect",function() {
   var inst =  $(this).data("value");
   Interface.draw("pianoRoll");
   Interface.draw("navigation");
   $(document).trigger("addInstrument",{"id":userID,"instrument":inst});
       
       
});

$(document).on("click",".login-button",function() {
    var index = parseInt($(this).data("index"));
    var num = $("#login-num")[0].value;
    
    if(index == 12){
        //clear all
        $("#login-num")[0].value = "";
    } else if(index == 10){
        //clear
        $("#login-num")[0].value = num.slice(0,-1);
    } else if(index == 11){
        index = 0;    
    } 
    if(!(index == 12 || index == 10)){
        $("#login-num")[0].value += index;
    }
});

$(document).on("click","#login-connect",function() {
    var num = $("#login-num")[0].value;
    socket.emit('initialize',num);
});

$(document).on('click','.nav-icon',function(){
    var data = $(this).data("value");
    Interface.draw(data);
});
$(document).on('click','.pr-note',function(){
    var data = $(this).data("index");
    var id = $(this).data("id");
    pr[id].change(data);
    //pianoRoll.change(data);   
    
});

$(document).on("click",".patternButton",function(){
    
    var t = $(this);
    var index = parseInt( t.data("index") );
    
    pr[Object.keys(pr)[0]].setCurrent(index);
    
    $(".patternButton").removeClass("pB-active");
    t.addClass("pB-active");
    
});


// depreciated html5 number field test
$(document).on('keyup mouseup change',".controller", function () {
    var index = $(this).data("index");
    var value = $(this)[0].value;
    
    //console.log(index + ", " + value);
    
    $(document).trigger("control",{"control":index,"level":value});
});

var swipeActive = true;
var swipeCooldown = 500;

$(document).on('swipedown','#piano-roll *',function(){
    if(swipeActive){
    //console.log("swipedown..");
        pr[Object.keys(pr)[0]].move(1);
        swipeActive = false;
        setTimeout(function(){
            swipeActive = true;
        },swipeCooldown);
    }
});
$(document).on('swipeup'  ,'#piano-roll *',function(){
    if(swipeActive){
    //console.log("swipeup..");
        pr[Object.keys(pr)[0]].move(-1);
        swipeActive = false;
        setTimeout(function(){
            swipeActive = true;
        },swipeCooldown);
    }
});

$(document).on("tick",function(event,data) {
    
    //get first in pr:
    //pianoRoll.tick(data);
    pr[Object.keys(pr)[0]].tick(data);
});

var pr = {};
var hue;

$(document).on("addInstrument",function(event,data){
    console.log("data0:" + data.id + " + data1: " + data.instrument);
    console.log(info[data.instrument].preset);
    var desc = {
        "synth":
            {"type":"synth"}
        ,
        "bass":
            {"type":"synth"}
        ,
        "drums":
            {"type":"drums","names":["Kick","HiHat","Closed","Snare","Bass","Block","Ride","Tamb","Tom Lo"]}
        
    };
    
    
    $(document).trigger("pickInstrument",{"id":data.id,"instrument":data.instrument});
    //socket.emit("pickInstrument",{"id":data.id,"instrument":data.instrument});
    SliderController.setPreset(info[data.instrument].preset);
    
    hue = (parseInt(data.id)*1.08)%360;
    $(".interface").css({"background-color":"hsla({},40%,80%)".format(hue)});
    $(".nav-icon").css({"background-color":"hsla({},100%,70%)".format(hue)});
    
    socket.emit("pickInstrument",{"id":data.id,"instrument":data.instrument, "colorUser":hue});
        
    
    var roll = new PianoRoll();
    var instdesc = desc[data.instrument];
    roll.init($("#piano-roll"),instdesc,data.id);
    roll.draw();
    pr[data.id] = roll;
    
    //preventScroll();
    
});

var preventScroll = function(){
    
    $(document).on('touchmove','#pr-container',function(event) {
        event.stopPropagation();
        console.log(event);
    });
    
    $(document).on("touchmove", function(event){
        event.preventDefault();
    });
    
}

$(document).ready(function(){
    socket = io();
    
    
    socket.on('answer',function(data){
        console.log("data.info:" + data.info);
        info = data.info;
        Interface.draw("instrumentSelection");
    });
    
    Interface.init();
    Interface.draw("login");

    
    
})