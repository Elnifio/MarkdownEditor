import Controller from "./control.js";


let THRESHOLD = 10;
let REFRESH = 10;

let View = function() {
    this.context = document.getElementById("main-container");
    this.editor = document.getElementById("editor");
    this.display = document.getElementById("display-container");
    this.controller  = new Controller(this, this.editor.value);

    this.startTime = new Date();

    this.editor.style.height = `${window.innerHeight > this.editor.scrollHeight?window.innerHeight:this.editor.scrollHeight}px`;

    this.update = function(value) {
        this.display.innerHTML = value;
    }

    this.updateHeights = function() {
        this.editor.style.height = `${window.innerHeight > this.editor.scrollHeight?window.innerHeight:this.editor.scrollHeight}px`;
    }

    this.toggleDisplay = function() {
        this.display.style.display = (this.display.style.display=="none")?"block":'none';
    }

    this.notifyController = function() {
        this.controller.updateView(this.editor.value);
    }

    let currentTime;

    this.listener = setInterval(() => {
        currentTime = new Date();
        if (currentTime - this.startTime >= REFRESH * 1000) {
            this.notifyController();
            this.startTime = currentTime;
        } else {
            console.log("waiting...");
        }
    }, 1000);

    this.stopIter = function() {
        clearInterval(this.listener);
    }

    this.editor.addEventListener("input", (e) => {
        this.notifyController();
        this.startTime = new Date();
        this.updateHeights();
    })

    console.log("Init View Success");

    this.notifyController();
}

$(() => {
    // $("#editor").css('height', `${window.innerHeight}`);
    console.log("Load Script Success");
    let view = new View();
    view.toggleDisplay();

    $('#toggle-display').on('click', (e) => {
        e.preventDefault();
        view.toggleDisplay();
    });

})

/** 
$(() => {
    // Set textarea size to current window height
    

    // test area
    // let canvas = document.createElement("canvas");
    // canvas.width = 500;
    // canvas.height = 500;
    $("#display-container").css("display", 'block');
    // $('#display-container').append(canvas);
    // let cursor = canvas.getContext("2d");
    // cursor.arc(100, 100, 20, 0, Math.PI * 2);
    // cursor.stroke();

    // Init new parser
    let startTime = new Date();
    let value = $("#editor").val();
    console.log(value);
    // let parser = new Parser(value);
    let a = setInterval(() => {
        let currentTime = new Date();
        if (currentTime - startTime >= 5000) {
            
            value = $("#editor").val();
            console.log(`JQuery: ${value}`);
            console.log(`JS: ${document.getElementById("editor").innerHTML}`);
            // parser = new Parser(value);
            startTime = new Date();
        } else {
            console.log("waiting")
        }
    }, 1000);
    $("#editor").on("keydown", (e) => {
        console.log(e.key);
        startTime = new Date();
        $("#editor").css('height', `${window.innerHeight}`);
    }); 
})

*/