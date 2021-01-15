import Controller from "./control.js";

import defaultaes from './aes.js';

const fs = require('fs');

let folderPrefix = 'NOTE-FOLDER-';
let filePrefix = 'NOTE-FILE-';
let root = './notes';

let currentlySelected = undefined;
let currdir = './notes';
let currfile = undefined;

let THRESHOLD = 10;
let REFRESH = 10;
let OFFSET = 0;

let newly_init = true;

let View = function() {
    this.context = document.getElementById("main-container");
    this.editor = document.getElementById("editor");
    this.display = document.getElementById("display-container");
    this.controller  = new Controller(this, this.editor.value);
    this.toolbars = document.getElementById("toolbars");
    this.folders = document.getElementById('file-container');
    this.foldertoolbars = document.getElementById('utility-container');

    // Initiate folder view:
    let loader = document.createElement('div');
    this.folders.append(loader);
    loader.innerHTML = `<p><i class="fa fa-spinner fa-spin"></i>&nbsp;Loading Notes</p>`;

    this.startTime = new Date();
    console.log(this.startTime);

    this.updateEditor = function(value) {
        this.editor.value = value;
        this.notifyController();
    }

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

        height = this.folders.parentElement.clientHeight - this.foldertoolbars.clientHeight;
        this.folders.style.height = `${height}px`;
        
        
    }

    this.toggleDisplay = function() {
        this.display.style.display = (this.display.style.display=="none")?"block":'none';
    }

    this.notifyController = function() {
        this.controller.updateView(this.editor.value);
    }

    this.save = function() {
        if (newly_init) {
            newly_init = false;
            return;
        }
        if (currfile) {
            fs.writeFile(currfile, this.editor.value, (e) => console.log(e));
        } else {
            fs.writeFile(root + '/' + 'scratch.md', this.editor.value, (e) => console.log(e));
        }
    };

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

let renderDirectory = function(name, path, indent, view) {
    let out = document.createElement('div');
    out.setAttribute('class', 'note-folder');
    out.setAttribute('id', `${folderPrefix}${name}`);

    out.style.marginLeft = `${indent}px`;

    let title = document.createElement('span');
    title.setAttribute('class', 'note note-folder-name');
    title.style.display = 'block';
    title.innerHTML = `<i class='fas fa-angle-right'></i> <strong>${name}</strong>`;
    out.append(title);

    let childContainer = document.createElement('div');
    childContainer.setAttribute('class', 'note-expand');
    out.append(childContainer);
    let opened = false;

    title.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        currdir = path + '/' + name;

        if (opened) {
            childContainer.innerHTML = "";
            title.innerHTML = `<i class='fas fa-angle-right'></i> <strong>${name}</strong>`;
            opened = false;
        } else {
            title.innerHTML = `<i class='fas fa-angle-down'></i> <strong>${name}</strong>`;
            opened = true;
            fs.readdir(path + '/' + name, {withFileTypes:true}, (err, files) => {
                if (err) {
                    console.log(err);
                } else {
                    files.forEach(x => {
                        if (x.isDirectory()) {
                            childContainer.append(renderDirectory(x.name, path + '/' + name, indent + 1, view));
                        } else if (x.isFile()) {
                            childContainer.append(renderFile(x.name, path + '/' + name, indent + 1, view));
                        } else {
                            console.log(`Unrecognized file ${x.name}`);
                        }
                    })
                }
            })
        }

        if (!currentlySelected) {
            currentlySelected = title;
        } else {
            currentlySelected.getAttributeNode('class').value = currentlySelected.getAttributeNode('class').value.replace(/\s*note\-highlight\s*/g, '');
            currentlySelected = title;
        }

        if (currentlySelected) {
            currentlySelected.getAttributeNode('class').value = currentlySelected.getAttributeNode('class').value + ' note-highlight';
        }
    })

    return out;
}

let renderFile = function(name, path, indent, view) {
    let out = document.createElement('div');
    let fullpath = path + '/' + name;
    out.setAttribute('class', 'note note-file');
    out.setAttribute('id', `${filePrefix}${name}`);
    out.style.marginLeft = `${indent}px`;
    
    let fileTitle = document.createElement('span');
    fileTitle.innerHTML = `<i class='fas fa-angle-right placeholder-icon'></i> ${name}`;
    out.append(fileTitle);
    out.append(document.createElement('br'));

    out.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (currfile != fullpath) {
            view.save();
        }

        currdir = path;
        currfile = fullpath;

        fs.readFile(fullpath, (err, data) => {
            if (err) {
                console.log(err);
            } else {
                view.updateEditor(data.toString());
            }
        })

        if (!currentlySelected) {
            currentlySelected = out;
        } else {
            currentlySelected.getAttributeNode('class').value = currentlySelected.getAttributeNode('class').value.replace(/\s*note\-highlight\s*/g, '');
            currentlySelected = out;
        }

        if (currentlySelected) {
            currentlySelected.getAttributeNode('class').value = currentlySelected.getAttributeNode('class').value + ' note-highlight';
        }
    })

    return out;
}

$(() => {
    $("#display-style").text(processStyle());

    let view = new View();

    fs.readdir(root, {withFileTypes:true}, (err, result) => {
        view.folders.innerHTML = "";
        if (err) {
            fs.mkdir(root, (er) => console.log(er));
        } else {
            result.forEach( x => {
                if (x.isDirectory()) {
                    view.folders.append(renderDirectory(x.name, root, 0, view));
                } else if (x.isFile()) {
                    view.folders.append(renderFile(x.name, root, 0, view));
                } else {
                    console.log(`Unrecognized file ${x.name}`);
                }
            })
        }
    });

    view.toggleDisplay();

    $('#file-utility-container').on('click', (e) => {
        e.preventDefault();
        currdir = './notes';
        currentlySelected.getAttributeNode('class').value = currentlySelected.getAttributeNode('class').value.replace(/\s*note\-highlight\s*/g, '');
        currentlySelected = undefined;
    });

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