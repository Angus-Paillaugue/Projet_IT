$("body").ready(function(){
    head()
    navbar();
});


function navbar() {
    $.get("/navbar", function(data) {
        $("#navbar").replaceWith(data);
        if(getCookie("token")){$("#right-nav-part-not-logged").hide();}else{$("#right-nav-part-logged").hide();}
        $(".toggle-nav-bar-button").each(function(){$(this).click(function(e){if($($(this).parent().find(".nav-bar-content")[0]).css("display") == "none"){$($(this).parent().find(".nav-bar-content")[0]).css("display", "flex");}else {$($(this).parent().find(".nav-bar-content")[0]).css("display", "none");}});});
    })
}


function head() {
    $("head").append(`<link rel="stylesheet" href="http://localhost/Projet_IT/public/src/output.css">`);
}