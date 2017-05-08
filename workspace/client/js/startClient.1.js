function startClient(){
        // Selectoren
    var idInput = document.getElementById("id");
    var button1 = document.getElementById("1");
    var button2 = document.getElementById("2");
    var button3 = document.getElementById("3");
    var button4 = document.getElementById("4");
    var button5 = document.getElementById("5");
    var button6 = document.getElementById("6");
    var button7 = document.getElementById("7");
    var button8 = document.getElementById("8");
    var button9 = document.getElementById("9");
    var button10 = document.getElementById("0");
    var buttonc = document.getElementById("c");
    var buttoncall = document.getElementById("call");
    var connectButton = document.getElementById("connect");
    var idInput = document.getElementById("id");
    var body = document.getElementById("body");
    
    //Container
    var connectSection = document.getElementById("connectSection");
    var inputSection = document.getElementById("inputSection");
    var instrument0 = document.getElementById("instrument0");
    var instrument1 = document.getElementById("instrument1");
    var pickInstrumentSelector = document.getElementById("pickInstrument");
    var userID;
    var instrumentID;
    
    var socket = io();
    
    function addDigit(event){
        var source = event.target || event.srcElement;
        var id = source.id;
        if(id == "1"){
            idInput.value += "1";
        }else if(id == "2"){
            idInput.value += "2";
        }else if(id == "3"){
            idInput.value += "3";
        }else if(id == "4"){
            idInput.value += "4";
        }else if(id == "5"){
            idInput.value += "5";
        }else if(id == "6"){
            idInput.value += "6";
        }else if(id == "7"){
            idInput.value += "7";
        }else if(id == "8"){
            idInput.value += "8";
        }else if(id == "9"){
            idInput.value += "9";
        }else if(id == "0"){
            idInput.value += "0";
        }else if(id == "c"){
            var len = idInput.value.length;
            console.log(len);
            if(len > 0){

                idInput.value= idInput.value.slice(0,-1);
            }
        }else if(id == "call"){
            idInput.value ="";
            idInput.setAttribute("placeholder","Screen ID eingeben");
        }
    }
    function initialize(){
        if(idInput.value != null || idInput.value != "undefined"){
            var connector = idInput.value;
            //Dem Server wird ein Verbindungsversuch fuer die ausgewaehlte
            //ID mitgeteilt
            socket.emit('initialize',connector);

            connectButton.disabled = true;
        }
    }
    $(document).on("changePattern",function(event,data){
            //console.log(data.pattern);
            socket.emit("changePattern",{"id":userID,"pattern":data.pattern});
    });
    function showThisInstrument(event){
        var id = event.target.id || event.srcElement.id;
        if(id != undefined && id != "undefined"){
            pickInstrumentSelector.style.display ="none";
            if(id == "int0"){
                instrument0.style.display = "block";
                socket.emit("pickInstrument",{"id":userID,"instrument":"bass"});
                $(document).trigger("addInstrument",{"id":userID,"instrument":"bass"});
            }else if (id =="int1"){
                instrument1.style.display = "block";
                socket.emit("pickInstrument",{"id":userID,"instrument":"drums"});
                $(document).trigger("addInstrument",{"id":userID,"instrument":"drums"});
            }
        }
    }
    function pickFunction(id){
        $(id).on("click",function(){showThisInstrument(id);});
    }
    socket.on('startClient',function(data){
        var nr = parseInt(data);
        userID = nr;
        
        Interface.init();
 
 /*
        connectSection.parentNode.removeChild(connectSection);
        inputSection.parentNode.removeChild(inputSection);

        // Hier muesste die Geraeteauswahl ausgeloest werden
        pickInstrumentSelector.style.display="block";
        var int0 = document.createElement("h1");
        int0.id = "int0";
        int0.innerHTML = "Bass synth";
        int0.addEventListener("click",showThisInstrument);

        pickInstrumentSelector.appendChild(int0);
    
        var int1 = document.createElement("h1");
        int1.id = "int1";
        int1.innerHTML = "Drums";
        int1.addEventListener("click",showThisInstrument);
        pickInstrumentSelector.appendChild(int1);
*/
        
        
    });
    socket.on('tick',function(data){
       console.log(data); 
       $(document).trigger("tick",data);
    });
    socket.on('wrongID',function(){
       alert("Kein Raum mit dieser ID vorhanden!");
       connectButton.disabled = false;
       idInput.value="";
       idInput.setAttribute("placeholder","Korrekte Screen ID eingeben");
    });
    button1.addEventListener("click",addDigit);
    button2.addEventListener("click",addDigit);
    button3.addEventListener("click",addDigit);
    button4.addEventListener("click",addDigit);
    button5.addEventListener("click",addDigit);
    button6.addEventListener("click",addDigit);
    button7.addEventListener("click",addDigit);
    button8.addEventListener("click",addDigit);
    button9.addEventListener("click",addDigit);
    button10.addEventListener("click",addDigit);
    buttonc.addEventListener("click",addDigit);
    buttoncall.addEventListener("click",addDigit);
    connectButton.addEventListener("click",initialize);
}