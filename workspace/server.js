
var http = require('http');
var path = require('path');

var async = require('async');
var socketio = require('socket.io');
var express = require('express');


var app = express();
var server = http.createServer(app);
var io = socketio.listen(server);
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true}));

app.set('view engine','jade')

app.set('views', path.join(__dirname,'views'));





app.use(express.static(path.resolve(__dirname, 'client')));
//app.use(express.static(path.resolve(__dirname, 'client/img' )));
//app.use('/img',express.static(path.join(__dirname, 'client/img')));

app.use(express.static(__dirname + '/public'));

app.get('/',function(req,res){
    console.log("Eine Neue Verbindung wurde aufgebaut von: " + req.ip);
  res.render('./test');
});

app.get('/host', function(req,res){
  res.render('./host');
});
app.get('/lobby', function(req,res){
  res.render('./lobby');
});
app.get('/a', function(req,res){
    res.render('./admin');
});
app.get('/statusServer', function(req,res){
    res.render('./status');
})
app.get('/p', function(req,res){
    res.render('./datHost');
});
app.get('/c', function(req,res){
    res.render('./datClient');
});
app.get('/test', function(req,res){
    res.render('./test');
});
//Client
app.get('/startClient', function(req,res){
    res.render('./startClient');
});
//Host
app.get('/startHost', function(req,res){
    res.render('./startHost');
});

app.post('/client', function(req,res){
    var nr = req.body.nr;
    res.render('./client',{nummer: nr});
});
app.get('/status',function(req,res){
    res.render('./status');
})



var usernames = {};
var roomList =[];
var available = [];

app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });


// Socket.io handler
io.on('connection', function(socket){
    console.log("new socket id joined: " + socket.id);
    socket.on('ready',function(){
        var random = Math.floor(Math.random()*10000);
        while(available.indexOf(random)>-1){
            random = Math.floor(Math.random()*10000);
        }
        var readyHost = {socket:socket,id:socket.id,nr:random,isConnected:"false",owner:"nobody"};
        var len = available.length;
        available.push(readyHost);
        socket.emit('id',random);
        socket.join(random);
        
        var user = {socket:socket,id:socket.id,nr:random,name:"host",userStatus:"user"};
            
        usernames[socket.id]= user;
    });
    socket.on('initialize',function(data){
        var len = available.length;
        var k;
        for (var i = 0; i < len; i++){
            if(available[i].nr == data){
                if(available[i].isConnected == "false"){
                    available[i].isConnected = "true";
                    available[i].owner = socket.id;
                   
                }
                 k = i;
            } 
        }
        if(available[k] != undefined && available[k] != "undefined"){

            // diese randomZahl muss noch abgesichert werden gegen duplikate
            var random = Math.floor(Math.random()*10000);
            var user = {socket:socket,id:socket.id,nr:data,name:random,userStatus:"user"};
            
            usernames[socket.id]= user;
            socket.join(data);
            socket.emit('startClient',{"user":usernames[socket.id].name,"host":data});
            console.log("User" + user.name + " hat sich mit Raum " + user.nr + " verbunden.");
            if(available[k].owner == socket.id) {
                io.sockets.in(data).emit('startHost',k);
                console.log("Raum " + data + " wurde eingerichtet.");
                io.to(socket.id).emit('admin',usernames[socket.id].name);
                usernames[socket.id].userStatus = "admin";

            }
        }else{
            io.to(socket.id).emit('wrongID');
        }
    });
    socket.on('reconnectRequest',function(data){
        console.log(data);
       if(data.connector === "host"){
           var len = available.length;
           var readyHost = {socket:socket,id:socket.id,nr:data.hostID,isConnected:"true",owner:"reconnect"};
           available.push(readyHost);
           socket.join(data.hostID);
           socket.emit("updateID",len);
           var user = {socket:socket,id:socket.id,nr:data.hostID,name:"host",userStatus:"user"};
           
            
            usernames[socket.id]= user;
            console.log("host reconnected");
       }else if(data.connector === "client") {
            if(data.admin == true){
                var user = {socket:socket,id:socket.id,nr:data.hostID,name:data.id,userStatus:"admin"};   
            }else{
                var user = {socket:socket,id:socket.id,nr:data.hostID,name:data.id,userStatus:"user"};
            }
            usernames[socket.id]= user;
            socket.join(data.hostID);
            console.log("User" + user.name + " hat sich mit Raum " + user.nr + " erneut verbunden.");
            socket.emit("staticUser",{"id":data.hostID});
            if(data.admin == true){
                socket.emit("admin","admin");
            }
       } 
    });
    socket.on('request',function(data){
        var hostID = findHostByNumber(data);
        io.to(hostID).emit('request',usernames[socket.id].name);
    });

    socket.on('answer',function(data){
        var recipientID = findUserByName(data.recipient); 
        io.to(recipientID).emit('answer',data);
    });

    socket.on('pickInstrument',function(data){
        if(usernames[socket.id] != undefined){
            io.sockets.in(usernames[socket.id].nr).emit('pickInstrument',data);
        }
    });
    socket.on('control',function(data){
        //console.log("control: " + data);
        io.sockets.in(usernames[socket.id].nr).emit('control',data);
    });
    
    socket.on('changePattern',function(data){
        //console.log(data.pattern);
        if(usernames[socket.id] != undefined){
            io.sockets.in(usernames[socket.id].nr).emit('changePattern',data);
        }
    });
    
    socket.on('tick',function(data){
        if(available[data[0]] != undefined){
            io.sockets.in(available[data[0]].nr).emit('tick',data[1]);
    
        }    
    });
    socket.on('start',function(data){
        io.sockets.in(data).emit('start');
    });
    socket.on('stop',function(data){
        io.sockets.in(data).emit('stop');
    });
    socket.on('speed',function(data){
        console.log(data);
       io.sockets.in(data[0]).emit('speed',data[1]); 
    });
    socket.on('pattern',function(data){
        console.log(data);
       io.sockets.in(data[0]).emit('newPattern',data[1]); 
    });
    socket.on('deleteInstrument',function(data){
        console.log("deleteInstrument");
        io.sockets.in(usernames[socket.id].nr).emit('deleteInstrument',data);
    });
    
    function findUserByName(name){
        
       for(var id in usernames){
           if(usernames[id].name == name){
               return id;
           }
       }
    };
    function findHostByNumber(number){
        var len = available.length;
        for(var i= 0;i<len;i++){
            if (available[i].nr == number){
                return available[i].id;
            }
        }
    }


    function updateHosts(){
        var len = available.length;
        for(var i = 0; i < len ; i++){
            
            io.to(available[i].id).emit('updateID',i);
        }
        //console.log("Hosts updated");
    };

    function getUserList(nr){
        var list = [];
        for (var id in usernames){
            if(usernames[id].nr == nr){
                list.push(usernames[id].name);
            }
        }
        return list;
    };    
    function newAdmin(nr){
        var userlist = getUserList(nr);
        var len = userlist.length;
        var random = Math.floor(len*Math.random());
        var id = findUserByName(userlist[random])
        if(userlist.length > 1){
            if(usernames[id].name != "host"){
            io.to(usernames[id].id).emit('admin',"hallo");
            usernames[id].userStatus = "admin";
            }else{
                //console.log("reroll");
                newAdmin(nr);
            }
        }else if(userlist.length == 1){
            var host = findHostByNumber(nr);
            io.to(host).emit("noAdmin","admin");
            //console.log(host);
        }

    }
    socket.on('requestAdmin',function(data){
        if(available[data.nr] != undefined){
            newAdmin(data.id);
            //console.log("newAdmin");
        }else{
            //console.log(data.nr + "    " + data.id);
        }
    })
    socket.on('disconnect', function(){
        if(usernames[socket.id]!= undefined && usernames[socket.id] != "undefined" && usernames[socket.id].name != "host"){
            console.log("User" + usernames[socket.id].name + ' has disconnected from ' + usernames[socket.id].nr);
            var adminGone = false;
            io.sockets.in(usernames[socket.id].nr).emit('deleteInstrument',{"id":usernames[socket.id].name});
            if(usernames[socket.id].userStatus == "admin"){
                adminGone = true;
                var nr = usernames[socket.id].nr;
                
            }
            delete usernames[socket.id];
            if(adminGone){
                newAdmin(nr);
            }
        }else{
            
            var len = available.length;
            var k;
            // for (i=0;i<len;i++){
            //     console.log(i+ ". : ");
            //     console.log(available[i]);
            // }
            var found = false;
            for (var i = 0; i < len; i++){
                if (found == false){
                if(available[i].id == socket.id){
                    //console.log("got here at " + i);
                    if(available[i].nr == undefined){
                        //console.log("whathappendHERE???");
                    }else{
                        console.log("Host" + available[i].nr + " has disconnected.");
                        var roomnr = available[i].nr;
                        
                        io.sockets.in(roomnr).emit('hostDisconnect',"disconnect");
                        available.splice(i,1);
                        //console.log("after splice:");
                        //console.log(available);
                        delete usernames[socket.id];
                        
                        updateHosts();
                        console.log("Hosts updated");
                        found = true;
                    }
                }
                }
            }
        }

    });

});

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("WebAppServer listening at", addr.address + ":" + addr.port);
});
function serverStart(){
    
  io.sockets.emit("serverStarted","DataJam");  
  console.log("Data is ready to Jam");
};
setTimeout(serverStart,5000);
//serverStart();