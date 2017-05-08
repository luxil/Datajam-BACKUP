function startHost(){
    var socket = io();
    var hostID = 1;
    var hostNR;  // nur fuer schnelle Kommunikation des Ticks, sonst nicht verwenden.
    var admin = false;

    function reconnect(){
       socket.emit("reconnectRequest",{"hostID":hostID,"connector":"host"});
       console.log("Reconnected"); 
    };

    reconnect();

    socket.on('id',function(data){
        id.innerHTML = "ID: " + data;
        hostID = parseInt(data);
        document.title = "ID: " + hostID + " HOST";
        
    });

    document.title = "ID: " + hostID + " HOST";
    
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
        admin = true;
        hostNR = parseInt(data);
        
        
        console.log("Connection established for " + hostID);
        //notConnected.style.display = "none";
        // hier muss der host visible werden
        //connected.style.display ="block";
       
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
    });
    
    socket.on('request',function(data) {
        
        socket.emit('answer',{"hostNR":hostNR,"recipient":data,"info":Instruments.info()});
    });
    socket.on('noAdmin',function(data){
       console.log("kein Admin verfuegbar") ;
       admin = false;
    });
}
