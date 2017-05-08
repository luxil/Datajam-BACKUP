var context = new AudioContext;
var eg1 = function(node,time,length,eg){
            // eg = [a,d,s,r]
            var start = time;
            var max = node.value;
            node.cancelScheduledValues(0);
            node.setValueAtTime(0, time);
            node.linearRampToValueAtTime(max, time + eg[0]);
            node.linearRampToValueAtTime(max * eg[2], time + eg[0] + eg[1]);
            node.linearRampToValueAtTime(0, time + length + eg[3]);
        }
var eg2 = function(node,time,length,eg){
    // eg = [a,d,s,r]
    var start = time;
    var max = node.value;
    node.cancelScheduledValues(0);
    node.setValueAtTime(0, time);
    node.linearRampToValueAtTime(max, time + eg[0]);
    node.linearRampToValueAtTime(max * eg[2], time + eg[0] + eg[1]);
    node.linearRampToValueAtTime(0, time + length + eg[3]);
}

var soundSource, IR, SnareIR;

var ajaxRequest = new XMLHttpRequest();
ajaxRequest.open('GET', 'sample/Convolve.wav', true);
ajaxRequest.responseType = 'arraybuffer';

ajaxRequest.onload = function() {
  var audioData = ajaxRequest.response;
  context.decodeAudioData(audioData, function(buffer) {
      IR = buffer;
      soundSource = context.createBufferSource();
      soundSource.buffer = IR;
    }, function(e){"Error with decoding audio data" + e.err});
    context.decodeAudioData(audioData, function(buffer) {
      SnareIR = buffer
      soundSource = context.createBufferSource();
      soundSource.buffer = IR;
    }, function(e){"Error with decoding audio data" + e.err});
}

ajaxRequest.send();

function Instrument(types) {

    this.create = function (type) {
        var inst = false;
        
        for (var t in types) {
            if (types.hasOwnProperty(t)) {
                var o = types[t].object;
                if( t == type){
                    inst = new o();
                }
            }
        }

        inst.type = type;
        
        inst.getType = function () {
            console.log(this.type)
        }
        
        this.control = function(controlId,level){
        }
        
        
        
        this.preset = [];
        
        return inst;
    }
}

var Bass = function () {
    
    this.freq = 1000;
    this.q = 5;
    this.decay = 0.3;
    this.fmCorse = 0;
    this.fmLevel = 0;
    this.feedback = 0.2;
    
    
    // create Bus on init
    
    //var feedback = this.feedback;
    this.delayNode = context.createDelay();
    this.delayGain = context.createGain();
    this.feedbackNode = context.createGain();
    this.bus = context.createGain();
    this.output =  context.createGain();
     
    this.feedbackNode.gain.value = this.feedback * 0.8;
    this.delayGain.gain.value = this.feedback;
    this.delayNode.delayTime.value = 0.5;
        
    
    this.bus.connect(this.delayNode);
    this.bus.connect(this.output);
    
    this.delayNode.connect(this.delayGain);
    this.delayGain.connect(this.feedbackNode);
    this.feedbackNode.connect(this.delayNode);
    this.delayGain.connect(this.output);
    this.output.connect(context.destination);
    
    
    this.control = function(controlId,level){
        if(controlId == 0){
            //this.freq = 30 + (level*2000);
            this.feedback = level;
            this.feedbackNode.gain.value = this.feedback * 0.8;
            this.delayGain.gain.value = this.feedback;
        } else if(controlId == 1){
            this.decay = level / 2 + 0.05;
        } else if(controlId == 2){
            this.fmCorse = Math.floor(level * 4);
        } else if(controlId == 3){
            this.fmLevel = level * 100;
        }
    }
    
    Bass.eg1 = function(node,time,length,eg){
        // eg = [a,d,s,r]
        var start = time;
        var max = node.value;
        node.cancelScheduledValues(0);
        node.setValueAtTime(0, time);
        node.linearRampToValueAtTime(max, time + eg[0]);
        node.linearRampToValueAtTime(max * eg[2], time + eg[0] + eg[1]);
        node.linearRampToValueAtTime(0, time + length + eg[3]);
    }
    Bass.eg2 = function(node,time,length,eg){
        // eg = [a,d,s,r]
        var start = time;
        var max = node.value;
        node.cancelScheduledValues(0);
        node.setValueAtTime(0, time);
        node.linearRampToValueAtTime(max, time + eg[0]);
        node.linearRampToValueAtTime(max * eg[2], time + eg[0] + eg[1]);
        node.linearRampToValueAtTime(0, time + length + eg[3]);
    }
    
    /*this.play = function(note,time,length){
        var p = new this.playOnce(note,time,length);
        setTimeout(function(){
            p = null;
            console.log(p);
        },100);
        
    }*/
    
    this.play = function(note,time,length){
        
        var decay = this.decay;
        var feedback = this.feedback;
        var fmCorse = this.fmCorse;
        var fmLevel = this.fmLevel;
        
        var osc = context.createOscillator();
        var mod = context.createOscillator();

        var gain = context.createGain();
        var modGain = context.createGain();
        
        
        //var filter = context.createBiquadFilter();
        
        var f = 220*Math.pow(2,(note-69)/12);
        
        var eg =    [0,decay,0.3,decay];
        var modEg = [0,decay,0  ,decay];
        
        osc.frequency.value = f;
        mod.frequency.value = f * fmCorse;
        //osc.type = 'square';
        
        modGain.gain.value = fmLevel;
        gain.gain.value = 0.3;
        
        Bass.eg1(gain.gain,time,length,eg);
        Bass.eg2(modGain.gain,time,length,modEg);
        
        /*filter.type = "lowpass";
        filter.frequency.value = this.freq;
        filter.Q.value = this.q;
        */
        
        mod.connect(modGain);
        modGain.connect(osc.frequency);
        osc.connect(gain);
        gain.connect(this.bus);
        //filter.connect(gain);
        
        osc.start(time);
        osc.stop(time + length + eg[3]);
        mod.start(time);
        mod.stop(time + length + eg[3]);
        /*setTimeout(function(){
            osc.disconnect();
            console.log((time+length+eg[3])*1000);
        },(time+length+eg[3])*1000);*/
    };
    
};
 
var Synth = function () {
    
    this.freq = 1000;
    this.q = 5;
    this.gain = 0.3;
    
    this.bus = context.createGain();
    this.output = context.createGain();
    
    
    this.wet = context.createGain();
    this.convolver = context.createConvolver();
    
    this.output.gain.value = 0.4;
    this.wet.gain.value = 2;
    
    this.convolver.buffer = IR;
    
    this.bus.connect(this.convolver);
    this.bus.connect(this.output);
    this.convolver.connect(this.wet);
    this.wet.connect(this.output);
    this.output.connect(context.destination);
    

    this.control = function(controlId,level){
        if(controlId == 0){
            this.freq = 50 + (level*2000);
        } else if(controlId == 1){
            this.q = level * 30;
        } else if(controlId == 2){
            
        } else if(controlId == 3){
            
        }
    }

    Synth.eg1 = function(node,time,length,eg){
        // eg = [a,d,s,r]
        var start = time;
        var max = node.value;
        node.cancelScheduledValues(0);
        node.setValueAtTime(0, time);
        node.linearRampToValueAtTime(max, time + eg[0]);
        node.linearRampToValueAtTime(max * eg[2], time + eg[0] + eg[1]);
        node.linearRampToValueAtTime(0, time + length + eg[3]);
    }
    
    Synth.eg2 = function(node,time,length,eg){
        // eg = [a,d,s,r]
        var start = time;
        var max = node.value;
        node.cancelScheduledValues(0);
        node.setValueAtTime(0, time);
        node.linearRampToValueAtTime(max, time + eg[0]);
        node.linearRampToValueAtTime(max * eg[2], time + eg[0] + eg[1]);
        node.linearRampToValueAtTime(0, time + length + eg[3]);
    }

    this.play = function(note,time,length){
        
        var osc = context.createOscillator();
        var f = 440*Math.pow(2,(note-69)/12);
        osc.frequency.value = f;
        
        var biquadFilter = context.createBiquadFilter();
        biquadFilter.type = "peaking";
        biquadFilter.frequency.value = this.freq;
        biquadFilter.gain.value = this.q;
        
        var gain = context.createGain();
        
        
        gain.gain.value = this.gain - (this.q/50);
        var eg  =    [0,0.2,0.3,0.3];
        var eg2 =    [0,0.1,0.5,0.3];
        
        Synth.eg1(gain.gain,time,length, eg);
        Synth.eg2(biquadFilter.frequency,time,length,eg2);
        
        osc.connect(biquadFilter);
        biquadFilter.connect(gain);
        gain.connect(this.bus);
     
        osc.start(time);
        osc.stop(time + length + eg[3]);
    };
};

var Drums = function(){
    
    this.wetLevel = 1;
    
    this.distortion = context.createWaveShaper();

    function makeDistortionCurve(amount) {
      var k = typeof amount === 'number' ? amount : 50,
        n_samples = 44100,
        curve = new Float32Array(n_samples),
        deg = Math.PI / 180,
        i = 0,
        x;
      for ( ; i < n_samples; ++i ) {
        x = i * 2 / n_samples - 1;
        curve[i] = ( 3 + k ) * x * 20 * deg / ( Math.PI + k * Math.abs(x) );
      }
      return curve;
    };


    this.distortion.curve = makeDistortionCurve(0);
    this.distortion.oversample = '4x';
    
    this.bus = context.createGain();
    this.output = context.createGain();
    
    
    this.wet = context.createGain();
    //this.convolver = context.createConvolver();
    
    this.output.gain.value = 0.4;
    this.wet.gain.value = this.wetLevel;
    
    //this.convolver.buffer = SnareIR;
    
    this.bus.connect(this.distortion);
    //this.bus.connect(this.convolver);
    this.distortion.connect(this.output);
    //this.convolver.connect(this.wet);
    //this.wet.connect(this.output);
    this.output.connect(context.destination);
    
    this.control = function(controlId,level){
        if(controlId == 0){
            //this.wetLevel = level * 3;
            this.wet.gain.value = level * 3;
        } else if(controlId == 1){
            this.distortion.curve = makeDistortionCurve(level * 50);
        } else if(controlId == 2){
            
        } else if(controlId == 3){
            
        }
    }

    this.play = function(note,time,length){
        var buffer = sample[note].buffer;
        var source = context.createBufferSource();
        source.buffer = buffer;
        //if (!source.start)
        //  source.start = source.noteOn;
        //console.log(note);
        if(note == 3){
            source.connect(this.bus);
        } else{
            source.connect(this.distortion);
        }
        
        
        source.start(time);
    }
    
}

var instrumentList = {};
var analyserList = {};
    
//var Instruments = (function(){
var InstrumentClass = function(){
    var types = {
        "bass":{
            "object":Bass,
            "preset":[
                {"name":"Delay",    "value":0.1},
                {"name":"Length",   "value":0.2},
                {"name":"FM Octave","value":0.2},
                {"name":"FM Level", "value":0.2},
            ],
        },
        "synth":{
            "object":Synth,
            "preset":[
                {"name":"Freq",   "value":0.4},
                {"name":"Filter", "value":0.2},
            ],
        },    
        "drums":{
            "object":Drums,
            "preset":[
                {"name":"Room", "value":0.1},
                {"name":"Punch","value":0},
            ],
        },
    };
    var instrument = new Instrument(types);
    
    
    this.add = function(userId,type){
        //console.log("type:" + type);
        if(types.hasOwnProperty(type)){
            instrumentList[userId] = instrument.create(type);
        }
        console.log("created " + type + " analyser for user "+userId );
        var analyser = context.createAnalyser();
        //analyser.frequencyBinCount = 3;
        analyser.fftSize = 32;
        instrumentList[userId].output.connect(analyser);
        analyserList[userId] = analyser;
        
        //var frequencyData = new Uint8Array(analyser.frequencyBinCount);
        //analyser.getByteFrequencyData(frequencyData);
        
    }
    
    this.info = function () {
        /*var inf = {"presets":{}};
        for (var i in types) {
            inf.presets[i] = types[i].preset;
        }
        inf["names"] =  Object.keys(types);
        */
        return types;
    }
    
/*    return {
        add:add,
        info:info,
    }
    
})();*/
}
var Instruments = new InstrumentClass();


var AnalyserClass = function(){
    
    var raq;
    var height = $(window).innerHeight()/4;
    var marginFactor = 0.2;
    var margin = height*marginFactor;
    
    var width  = $(window).innerHeight()/2.8;
    
    this.getEQ = function(userId){
        var a = analyserList[userId];
        var frequencyData = new Uint8Array(a.frequencyBinCount);
        a.getByteFrequencyData(frequencyData);
        
        var f = [0,0,0]

        for(var i = 0; i < frequencyData.length; i++){
            f[Math.floor(3*i/frequencyData.length)] += frequencyData[i];
        }
        return f;
        
    }
    
    var draw = function(){
    
        raq = window.requestAnimationFrame(draw);
        for (var k in analyserList) {
            if(analyserList.hasOwnProperty(k)){
                var a = analyserList[k];
                var frequencyData = new Uint8Array(a.frequencyBinCount);
                a.getByteFrequencyData(frequencyData);
                var count = 3;
                var f = [0,0,0];
                //var fSum = [0,0,0];
                for(var i = 0; i < frequencyData.length; i++){
                    // correct frequencies from lin to log
                    var index = 3*(1 - Math.pow(0.03,(i)/frequencyData.length));
                    f[Math.min(Math.floor(index),f.length)] += frequencyData[i];
                    
                    
                    //fSum[Math.floor(index)] += 1;
                }
                
                
                //console.log(k + " " + f.join(","));
                var c = document.getElementById("analyser-"+k);
                var canvas = c.getContext("2d");
                
                //var width = canvas.canvas.clientWidth;
                canvas.clearRect(0, 0, width, height);
                //canvas.fillStyle = 'rgba(0, 0, 0, 0)';
                //canvas.fillRect(0, 0, width, height);
                
                var barWidth = width/f.length;
                var offset = 0;
                
                for(var i = 0; i < f.length; i++){
                    // amp 
                    var level = (count-i)*0.8*(1-Math.pow(3,(-f[i]/(256*frequencyData.length/f.length))));
                    //var level = f[i]/(256*frequencyData.length/f.length);
                    canvas.fillStyle = 'rgb(255,255,255)';
                    canvas.fillRect(i*barWidth,height-(height*level),barWidth,height*level);
                    //console.log([i*barWidth,height-(height*level),barWidth*(1-margin),height*level].join(","));
                }
            
            }
            
        }
        
    }
    this.toggle = function(){
        if(raq){
            window.cancelAnimationFrame(raq);
            raq = undefined;
        } else {
            draw();
        }
    }
    
}
var Analyser = new AnalyserClass();


$(document).on("changePlay",function(event, data) {
   Analyser.toggle(); 
});

$(document).on("pickInstrument",function(event,data) {
   Instruments.add(data.id,data.instrument); 

});

$(document).on("control",function(event,data){
   
   //instrumentList[data.id].control(data.control,data.level);
    
});
$(document).on("deleteInstrument",function(event,data){
   delete instrumentList[data.id];
   delete analyserList[data.id];
});
$(document).on("deleteAllInstruments",function(event,data){
   // wird aufgerufen wenn der Server komplett neugestartet wurde
   // muss alle vorhandenen Instrumente loeschen
});