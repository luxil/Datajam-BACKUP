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



var pianoRoll = (function(){
    var id;
    var elem;
    var container;
    var height;
    var width;
    var noteHeight;
    var noteWidth;
    var histWidth;
    var histFact = 3;   //history scale relative to note width 
    var numCol = 8;     //number of Coloumns
    var numRow = 16;    //number of Rows
    var patternLength = 16;
    
    //88 range: A0 - C8 | midi 9 - 96
    var range = 88;
    var lowest = 9;
    var root = 69;
    var names = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
    var color = ["w","b" ,"w","b" ,"w","w","b" ,"w","b" ,"w","b" ,"w"];
    
    //note format { pitch: int note, hold: float factor }
    
    
    var pattern = [
        [{"pitch":56,"hold":1}],[{"pitch":66,"hold":1}],[{"pitch":56,"hold":2}],[],
        [{"pitch":59,"hold":3}],[],[],[],
        [],[],[{"pitch":65,"hold":1}],[],
        [{"pitch":61,"hold":2}],[{"pitch":65,"hold":2}],[],[]
    ];
    
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
    
    var toggleNote = function(n,i){
        var a = pattern[i];
        console.log(a);
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
    
    var init = function(element,userId){
        id = userId;
        elem = element;
        height = elem.innerHeight();
        width = elem.innerWidth();
        histWidth = (width / numRow) * histFact;
        noteHeight = height / numRow;
        noteWidth = (width - histWidth) / numCol;
        container = $("<div id='pr-container'></div>");
        elem.append(container);
        console.log("width: " + width + " height: " + height + "\nnoteHeight: " + noteHeight + " noteWidth: " + noteWidth);
        $(document).trigger("changePattern",{"id":id,"pattern":pattern});
    }
    
    var draw = function(){
        container.empty();
        var p = calcPattern(pattern);
        for(var r = 0; r < numRow; r++ ){
            var top  = r * noteHeight;
            var note = root - r;
            var noteInt = note % 12;
            var octave = Math.floor(note/12);
            var noteName = names[noteInt]+octave;
            var histClass = "pr-h"+color[noteInt];
            
            var history = appendItem(container,{"classes":"pr-hist " + histClass, "text":noteName});
            history.css({"top":top,"left":0, "width": histWidth, "height": noteHeight, "line-height": noteHeight +"px"});
            
            var hasNote = p.hasOwnProperty(note);
            
            for(var c = 0; c < patternLength; c++){
                var left = c * noteWidth + histWidth;
                var thisWidth = noteWidth;
                
                var noteClass = "pr-n"+color[noteInt] + " pr-c" + c;
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
                
                var noteElem = appendItem(container,{"classes":"pr-note " + noteClass,"data":{"index":[c,note]},"attr":{"id":"pr-{}-{}".format(c,note)}});
                noteElem.css({"top":top,"left":left, "width": thisWidth, "height": noteHeight});

            }
        }   
    }
    
    var move = function(){
        
    }
    
    var getPattern = function(){
        return pattern;
    }
    
    var change = function(data) {
        var c = data[0];    
        var n = data[1];
        toggleNote(n,c)
        var t = $("#pr-{}-{}".format(c,n));
        if(t.hasClass("pr-active")){
            t.width(noteWidth);
        }
        t.toggleClass("pr-active");
        $(document).trigger("changePattern",{"id":id,"pattern":pattern});
    }
    
    var tick = function(step){
        $(".pr-note").removeClass("pr-current");
        var s = step % patternLength;
        var noteClass = ".pr-c" + s;
        $(noteClass).addClass("pr-current");
    }
    
    return {
        init:init,
        draw:draw,
        change:change,
        getPattern,
        tick:tick,
    }    
})();

$(document).on('click','.pr-note',function(){
    var data = $(this).data("index");
    pianoRoll.change(data);   
    //console.log(data);
});

$(document).on("tick",function(event,data) {
    //console.log(data);
    pianoRoll.tick(data);
});
$(document).on("addInstrument",function(event,data){
    //console.log("data0:" + data[0] + " + data1: " + data[1]);
    pianoRoll.init($("#piano-roll"),data);
    pianoRoll.draw();
});

$(document).ready(function(){
    
    //var userId = "12345678";
    
    //$(document).trigger("pickInstrument",{"id":userId,"instrument":"synth"});
    //$(document).trigger("pickInstrument",{"id":userId,"instrument":"bass"});
    
    //pianoRoll.init($("#piano-roll"),userId);
    //pianoRoll.draw();
    
    
})