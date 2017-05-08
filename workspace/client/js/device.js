function Instrument(types) {

    this.create = function (type) {
        var inst = false;
        
        for (var t in types) {
            if (types.hasOwnProperty(t)) {
                var o = types[t];
                if( t == type){
                    inst = new o();
                }
            }
        }

        inst.type = type;
        
        inst.getType = function () {
            console.log(this.type)
        }
        
        return inst;
    }
}

var Bass = function () {
    this.play = function(note,time,length){
        
        var osc = context.createOscillator();
        var gain = context.createGain();
        
        var f = 220*Math.pow(2,(note-69)/12);
        osc.frequency.value = f;
        osc.type = 'square';
        gain.gain.value = 0.3;
        
        osc.connect(gain);
        gain.connect(context.destination);
     
        osc.start(time);
        osc.stop(time + length);
    };
};
 
var Synth = function () {
    this.play = function(note,time,length){
        var osc = context.createOscillator();
        var f = 440*Math.pow(2,(note-69)/12);
        osc.frequency.value = f;
        
        osc.connect(context.destination);
     
        osc.start(time);
        osc.stop(time + length);
    };
};

var instrumentList = {};

var Instruments = (function(){
    
    var types = {"bass":Bass,"synth":Synth};
    var instrument = new Instrument(types);
    
    
    var add = function(userId,type){
        if(types.hasOwnProperty(type)){
            instrumentList[userId] = instrument.create(type);
        }
    }
    
    
    return {
        add:add,
    }
    
})();

$(document).on("pickInstrument",function(event,data) {
   Instruments.add(data.id,data.instrument); 
   console.log("instrument added " + data.instrument);

});