function startHost(){
    var socket = io();
    var id = document.getElementById("id");
    var notConnected = document.getElementById("notConnected");
    var connected = document.getElementById("connected");
    var hostID;
    var hostNR;
    var admin = false;
    var started = false;
    
    var isiPad = navigator.userAgent.match(/iPad/i) != null;
    if(isiPad){
        alert("iPad Host not supported - redirect to Client");
        window.location.assign("/startClient");
    }
    
    function reconnect(){
       window.location.reload();
       //socket.emit("reconnectRequest",{"hostID":hostID,"connector":"host"});
       console.log("Reconnected"); 
       if(started){
           
       }else{
           
       }
    };

    socket.emit("ready");

    socket.on('id',function(data){
        id.innerHTML = "ID: " + data;
        hostID = parseInt(data);
        document.title = "ID: " + hostID + " HOST";
        
    });

    $(document).keypress(function(event){
       if(event.keyCode === 32){
           if(started){
               $(document).trigger("startEvent","test");
           }
       }
    });
    
    $(document).on('tick',function(event,data) {
        socket.emit('tick',[hostNR,data]);
        //console.log("test " + data);
               // console.log("test " + globalStep);
    
    });
    socket.on('control',function(data){
        //$(document).trigger("control",{"id":data.id,"level":data.level,"control":data.control});
        instrumentList[data.id].control(data.control,data.level);
        //console.log("control event: " + data);
    });
    socket.on('changePattern',function(data){
        $(document).trigger("changePattern",{"id":data.id,"pattern":data.pattern});
        //console.log(data.pattern);
    });
    socket.on("pickInstrument",function(data){
        $(document).trigger("pickInstrument",{"id":data.id,"instrument":data.instrument, "colorUser":data.colorUser});
        $(document).trigger("newUser", {"id":data.id,"instrument":data.instrument,"colorUser":data.colorUser});
        if(admin == false){
            socket.emit("requestAdmin",{"nr":hostNR,"id":hostID});
        }
    });
    socket.on('updateID',function(data){
        console.log("updated");
       hostNR = parseInt(data); 
    });
    socket.on('startHost',function(data){
        
        hostNR = parseInt(data);
        admin = true;
        started = true;
        
        console.log("Connection established for " + hostID);
        notConnected.style.display = "none";
        // hier muss der host visible werden
        connected.style.display ="block";
        document.getElementById("server_nr").innerHTML = hostID;
       
    });
    socket.on('deleteInstrument',function(data){
        console.log("deleted");
       $(document).trigger('deleteInstrument',{"id": data.id}); 
       $(document).trigger('deleteUser',{"id":data.id});
    });
    socket.on('serverStarted',function(data){
        console.log("hostID: " + hostID );
        console.log(data);
        reconnect();
        //window.location.reload();
    });
    
    socket.on('request',function(data) {
        
        socket.emit('answer',{"hostNR":hostNR,"recipient":data,"info":Instruments.info()});
        if(admin == false){
           socket.emit("requestAdmin",{"nr":hostNR,"id":hostID});
           console.log("requested admin");
        }
    });
    socket.on('noAdmin',function(data){
       console.log("kein Admin verfuegbar") ;
       admin = false;
    });
}