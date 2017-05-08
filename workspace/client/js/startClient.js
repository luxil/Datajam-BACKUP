var userID;
var instrumentID;
var hostID;
var admin = false;
function startClient(){

 
    
    var socket = io();
    

    $(document).on("changePattern",function(event,data){
            //console.log(data.pattern);
            socket.emit("changePattern",{"id":userID,"pattern":data.pattern});
    });
    $(document).on("deleteInstrument",function(event,data){
            console.log("delete");
            socket.emit('deleteInstrument',{"id":userID});
    });
    $(document).on("control",function(event,data){
       socket.emit('control',{"id":userID,"level":data.level,"control":data.control}); 
    });
    
    socket.on('startClient',function(data){
        console.log("start Client()");
        
        var nr = parseInt(data.user);
        userID = nr;
        
        
        socket.emit("request",data.host);
        hostID = data.host;
        
 

        
    });
    socket.on('admin',function(data){
        console.log("accesslevel: admin");
        admin = true;
        $(document).trigger("admin",admin);
    });
    socket.on('tick',function(data){
       //console.log(data); 
       $(document).trigger("tick",data);
    });
    socket.on('wrongID',function(){
       alert("Kein Raum mit dieser ID vorhanden!");
    });
    socket.on('hostDisconnect',function(data){
       // alert("disconnected");
       window.location.reload(); 
    });
    socket.on('serverStarted',function(data){
        window.location.reload();
    //     console.log(data);
    //     console.log("hostID: " + hostID + " id: "+ userID);
    //   socket.emit("reconnectRequest",{"hostID":hostID,"connector":"client","id":userID,"admin":admin});
    //   socket.emit("deleteInstrument",{"id":userID});
    //   socket.emit("request",hostID);
       //$(document).trigger("instrumentSelection");
       //console.log("hallo neuer server"); 
    });
}