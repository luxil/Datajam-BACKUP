function test() {
    var width = screen.availWidth;
    var heigth = screen.availHeight;
    var form = document.getElementById("form");
    //alert(width + " " + heigth);
    if(width > 800 || heigth > 800){
        form.setAttribute("action","/startHost");
    }else{
        form.setAttribute("action","/startClient");
    }
    form.submit();
}