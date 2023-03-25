$(function() {
    main();
});
function main() {
    // Append scrips in the head
    $("head").append(`<script type="text/javascript" src="https://livejs.com/live.js"></script><link rel="stylesheet" href="http://localhost/Projet_72h/public/src/output.css">`);
    
    // Color theme
    if (localStorage.getItem('color-theme') === 'dark' || (!('color-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark');
    $(document).click((e) => {if(e.target.closest("#userMenuButton")){$($(".userMenuDropdown")[0]).toggleClass("hidden");}else if(!e.target.closest(".userMenuDropdown")){$($(".userMenuDropdown")[0]).addClass("hidden");} if(e.target.closest("#mobileMenuButton")){$("#mobileMenu").toggleClass("hidden");}else if(!e.target.closest("#mobileMenu")){$("#mobileMenu").addClass("hidden");}});
    if(getCookie("token")){$.post("/auth", {token:getCookie("token")}, (data) => {if(data.status == 200) $(".profilePicture").each(function(){$(this).attr("src", data.data.profilePicture);});});}else $(".profilePicture").each(function(){$(this).attr("src", "http://localhost/blog/public/src/defaultProfilePicture.png");});

    // Get logo and append it to wherever it's needed
    $(".logo").attr("src", "http://localhost/Projet_72h/public/src/logo.png");$("head").append(`<link rel="icon" href="http://localhost/Projet72h/public/src/logo.png" type="image/x-icon">`);
    $("#currentYear").text(new Date().getFullYear());
}

class Notification {
    constructor(title, content, status) {
        $(".notification").remove();
        if(status == "success"){
            $("body").append(`<div class="absolute z-50 bottom-10 right-10 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-gray-700 flex flex-row gap-1 items-start p-2 rounded-lg notification"><div class="flex flex-col"><div class="flex flex-row items-center content-start"><svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" fill="currentColor" class="fill-emerald-400" viewBox="0 0 16 16"><path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/></svg><p class="text-gray-900 dark:text-neutral-100 text-xl">${title}</p></div><p class="text-gray-900 dark:text-neutral-100 text-l">${content}</p></div><button type="button" class="p-1 flex flex-row justify-between items-center focus-visible:outline-offset-[-4px]" onclick="$(this).parent().fadeOut().remove()"><span class="sr-only">Dismiss</span><svg class="h-5 w-5 fill-gray-900 dark:fill-neutral-100 ml-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"></path></svg></button></div>`);
        }else{
            $("body").append(`<div class="absolute z-50 bottom-10 right-10 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-gray-700 flex flex-row gap-1 items-start p-2 rounded-lg notification"><div class="flex flex-col"><div class="flex flex-row items-center content-start"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="fill-red-400" viewBox="0 0 16 16"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg><p class="text-gray-900 dark:text-neutral-100 text-xl">${title}</p></div><p class="text-gray-900 dark:text-neutral-100 text-l">${content}</p></div><button type="button" class="p-1 flex flex-row justify-between items-center focus-visible:outline-offset-[-4px]" onclick="$(this).parent().fadeOut().remove()"><span class="sr-only">Dismiss</span><svg class="h-5 w-5 fill-gray-900 dark:fill-neutral-100 ml-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"></path></svg></button></div>`);
        }
        setTimeout(()=>{$(".notification").fadeOut(500, function() { $(this).remove(); });}, 3000);
    }
}