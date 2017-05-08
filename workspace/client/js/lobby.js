function lobby(){

    var socket = io();

    var lobby = document.getElementById("lobby");
    var form = document.getElementById("form");
    var hidden = document.getElementById("hidden");
    var liste = document.getElementById("liste");

    
   


    function submitJoin(id){
        var nr = parseInt(id);
        
        hidden.setAttribute("value",nr);
        //alert(hidden.value);
        $(form).submit();
    }
    
    function addHandler(div){
        $(div).on("click",function(){submitJoin(div.id);});
    }
    

    
    function createListItem(listItem){

        var item = document.createElement("button");
        item.id = listItem;
        item.innerHTML=listItem;
        item.setAttribute("value",listItem);;
        liste.appendChild(item);
        addHandler(item);
       

    }
    socket.on('update',function(data){
        $(liste).empty();
        data.forEach(createListItem);
        console.log(data);
    }); 
    /*
    socket.on('update',function(data){
        $(lobby).empty();
        data.forEach(createListItem);
    },function(){
        console.log("angekommen");
        var buttons = document.getElementsByTagName("button");
        var buttonsCount = buttons.length;
        for (var i = 0; i <= buttonsCount; i += 1) {
            buttons[i].onclick = function(e) {
                alert(this.id);
            };
        };
        
     }); */
     

    
   // lobby.addEventListener("click",function(){form.submit();});
   /*
    var list = document.createElement("ul");
    lobby.appendChild(list);
    
    function submitJoin(id){
        var nr = parseInt(id);
        console.log("cicked" + nr + id);
        socket.emit('joinRoom',nr);
    }
    function addSelectToItem(div){
        console.log(div);
        $(div).on("click",function(){submitJoin(div.id);});
        
    }
    function createListItem(listItem){
        var item = document.createElement("ul");
        item.innerHTML=listItem;
        item.id = listItem;
        list.appendChild(item); 
        addSelectToItem(item);
    }
    socket.on('update',function(data){
        console.log("hier war was")
        $(list).empty();
        data.forEach(createListItem);
    });
    socket.on('connected',function(data){
       location.replace("client.html"); 
    });
    */
}