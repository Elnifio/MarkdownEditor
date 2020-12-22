import Controller from "./control.js";

import defaultaes from './aes.js';


let THRESHOLD = 10;
let REFRESH = 10;
let OFFSET = 30;

let View = function() {
    this.context = document.getElementById("main-container");
    this.editor = document.getElementById("editor");
    this.display = document.getElementById("display-container");
    this.controller  = new Controller(this, this.editor.value);
    this.toolbars = document.getElementById("toolbars");

    this.startTime = new Date();

    this.update = function(value) {
        this.display.replaceChild(value, this.display.firstChild);
    }

    let height;

    this.updateHeights = function() {
        // this.editor.style.height = `${window.innerHeight > this.editor.scrollHeight?window.innerHeight:this.editor.scrollHeight}px`;

        height = window.innerHeight - this.toolbars.clientHeight - OFFSET;
        this.editor.style.height = `${height}px`;
        this.display.style.maxHeight = `${height}px`;
        this.context.style.maxHeight = `${height}px`;
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
        // this.updateHeights();
    })

    console.log("Init View Success");

    this.notifyController();
    this.updateHeights();
}

let processStyle = function(aes=defaultaes) {
    // let out = "<style>";
    let out = "";
    for (let i in aes) {
        out += `.${i} {`;
        for (let j in aes[i]) {
            out += `${j}:${aes[i][j]};`;
        }
        out += "}";
    }
    // out += "</style>";
    return out;
}

$(() => {
    // $("#editor").css('height', `${window.innerHeight}`);
    console.log("Load Script Success");
    $("#display-style").text(processStyle());

    let view = new View();
    view.toggleDisplay();

    $(window).on("resize", () => {
        view.updateHeights();
    })

    $('#toggle-display').on('click', (e) => {
        e.preventDefault();
        view.toggleDisplay();
    });

    $("#delete").on("click", (e) => {
        e.preventDefault();
        view.stopIter();
    })

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