import Controller from "../control.js";

import defaultaes from '../aes.js';

const fs = require('fs');

let folderPrefix = 'NOTE-FOLDER-';
let filePrefix = 'NOTE-FILE-';
let root = './notes';

let currentlySelected = undefined;
let currdir = './notes';
let currfile = undefined;

let THRESHOLD = 10;
let REFRESH = 10;
let OFFSET = 10;

let defaultText = "Start your note here.";

let newly_init = true;

let View = function() {
    this.context = document.getElementById("main-container");
    this.editor = document.getElementById("editor");
    this.display = document.getElementById("display-container");
    this.controller  = new Controller(this, this.editor.value);
    this.toolbars = document.getElementById("toolbars");
    this.folders = document.getElementById('file-container');
    this.foldertoolbars = document.getElementById('utility-container');
    this.fileNameEditor = document.getElementById('file-name-editor');

    // Initiate folder view:
    let loader = document.createElement('div');
    this.folders.append(loader);
    loader.innerHTML = `<p><i class="fa fa-spinner fa-spin"></i>&nbsp;Loading Notes</p>`;

    // Initiate timer
    this.startTime = new Date();
    console.log(this.startTime);

    /**
     * 
     * @param {str} value 
     * given a value, this function updates the editor and displayer with this value
     */
    this.updateEditor = function(value) {
        this.editor.value = value;
        this.notifyController();
    }

    /**
     * 
     * @param {HTMLElement} value 
     * given an HTMLElement, it replaces the inner-child of display with this element
     */
    this.update = function(value) {
        this.display.replaceChild(value, this.display.firstChild);
    }

    let height;
    /**
     * update the height of each element when necessary
     */
    this.updateHeights = function() {
        // this.editor.style.height = `${window.innerHeight > this.editor.scrollHeight?window.innerHeight:this.editor.scrollHeight}px`;

        height = window.innerHeight - this.toolbars.clientHeight - OFFSET;
        this.editor.style.height = `${height}px`;
        this.display.style.maxHeight = `${height}px`;
        this.context.style.maxHeight = `${window.innerHeight - OFFSET}px`;

        height = this.folders.parentElement.clientHeight - this.foldertoolbars.clientHeight;
        this.folders.style.height = `${height}px`;
        
        
    }

    /**
     * set if display is shown
     */
    this.toggleDisplay = function() {
        this.display.style.display = (this.display.style.display=="none")?"block":'none';
    }

    /**
     * notify controller to update parser
     */
    this.notifyController = function() {
        this.controller.updateView(this.editor.value);
    }

    /**
     * save current editing file
     */
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

    this.fileNameEditor.addEventListener('focusout', (e) => {
        e.preventDefault();
        if (!newly_init) {
            this.rename();
        }
    })

    this.loadCurrName = function() {
        this.fileNameEditor.value = currfile.replace(root + '/', '');
    }

    // TODO: FIX THIS BUG
    // when target directory contains a same file with same name, 
    // pop up with a window that requires confirmation
    // instead of direct replacement
    this.rename = function() {
        let newname, dir, doc, splitted;

        if (!newly_init && currfile) {
            newname = this.fileNameEditor.value;
            splitted = newname.split('/');
            console.log(splitted);
            doc = splitted[splitted.length - 1];

            if (!doc.match(markdownRE)) {
                this.loadCurrName();
            } 
            
            else {
                dir = newname.replace(doc, '');

                fs.mkdir(root + '/' + dir, {recursive:true}, (err) => {
                    // console.log(`mkdir finished for dir ${dir}`);
                    // console.log(err);
                    if (!err) {
                        // console.log(`currfile: ${currfile}, newname: ${newname}`);
                        fs.rename(currfile, root + '/' + newname, (er) => {
                            // console.log(`rename finished for file ${newname}`);
                            if (!er) {
                                // console.log(`Rename success`);
                                currfile = newname;
                                this.updateRootDir();
                            } else { console.log(er); }
                            this.loadCurrName();
                        })
                    }

                    else { this.loadCurrName(); }
                })
            }
        } else {
            console.log(`Newly_init: ${newly_init}; currfile: ${currfile}`);
        }
    }

    // TODO: UPDATE WITH A CONFIRMATION PANEL
    // TODO: UPDATE A TRASHBIN FUNCTION
    this.delete = function() {
        newly_init = true;
        fs.unlink(currfile, (err) => {
            if (err) console.log(err);
            else {
                
                this.updateRootDir();
                this.updateEditor(defaultText);
                this.fileNameEditor.value = '';
            }
        });
    }

    let currentTime;
    /**
     * Listener for content
     */
    this.listener = setInterval(() => {
        currentTime = new Date();
        if (currentTime - this.startTime >= REFRESH * 1000) {
            this.notifyController();
            this.startTime = currentTime;
        }
        // else {
        //     console.log("waiting...");
        // }
    }, 1000);

    /**
     * Stops the listener
     */
    this.stopIter = function() {
        clearInterval(this.listener);
    }

    /**
     * On each input: update the controller to change display result
     */
    this.editor.addEventListener("input", (e) => {
        this.notifyController();
        this.startTime = new Date();
        // this.updateHeights();
    })

    /**
     * 
     * @param {str} name: Name of current directory
     * @param {str} path: parent directory of current directory
     * @param {int} indent: indentation of current folder
     * Renders a directory;
     */
    let markdownRE = /.md$/
    this.renderDirectory = function(name, path, indent) {
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
        
        /**
         * Click listener: 
         * when directory is clicked, we either collapse the child container,
         * or read all contents of this directory, and render each item based on if it's a directory or a file
         */
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
                                childContainer.append(this.renderDirectory(x.name, path + '/' + name, indent + 1, this));
                            } else if (x.isFile()) {
                                if (x.name.match(markdownRE)) {
                                    childContainer.append(this.renderFile(x.name, path + '/' + name, indent + 1, this));
                                }
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
        });
    
        return out;
    }

    /**
     * 
     * @param {str} name: Name of current file
     * @param {str} path: parent directory of current file
     * @param {int} indent: indentation of current file
     */
    this.renderFile = function(name, path, indent) {
        let out = document.createElement('div');
        let fullpath = path + '/' + name;
        out.setAttribute('class', 'note note-file');
        out.setAttribute('id', `${filePrefix}${path}/${name}`);
        out.style.marginLeft = `${indent}px`;
        
        let fileTitle = document.createElement('span');
        fileTitle.innerHTML = `<i class='fas fa-angle-right placeholder-icon'></i> ${name}`;
        out.append(fileTitle);
        out.append(document.createElement('br'));
    
        out.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
    
            if (currfile != fullpath) {
                this.save();
            }
    
            currdir = path;
            currfile = fullpath;
    
            fs.readFile(fullpath, (err, data) => {
                if (err) {
                    console.log(err);
                } else {
                    this.updateEditor(data.toString());
                    this.loadCurrName();
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

    this.newFile = function() {
        fs.readdir(currdir, (err, result) => {
            if (err) {
                console.log(err);
            } else {
                let name = 'untitled';
                while (result.indexOf(name + '.md') >= 0) {
                    name = name + '(1)';
                }
                fs.writeFile(currdir + '/' + name + '.md', defaultText, (er) => {
                    if (er) {
                        console.log(er);
                    } else {
                        this.updateEditor(defaultText);
                        this.updateRootDir();
                    }
                })
            }
        })
    }

    this.loadCurrFile = function() {
        fs.readFile(currfile, (err, data) => {
            if (err) {
                console.log(err);
            } else {
                this.updateEditor(data.toString());
            }
        })
    }

    this.updateRootDir = function() {
        fs.readdir(root, {withFileTypes:true}, (err, result) => {
            let out = document.createElement('div');
            if (err) {
                fs.mkdir(root, (er) => console.log(er));
            } else {
                result.forEach(x => {
                    if (x.isDirectory()) {
                        out.append(this.renderDirectory(x.name, root, 0));
                    } else if (x.isFile()) {
                        if (x.name.match(markdownRE)) {
                            out.append(this.renderFile(x.name, root, 0));
                        }
                    } else {
                        console.log(`Unrecognized file ${x.name}`);
                    }
                })
            }
            this.folders.replaceChild(out, this.folders.firstChild);
        });
    };

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

    $("#display-style").text(processStyle());

    let view = new View();

    view.updateRootDir();

    view.toggleDisplay();

    $('#file-utility-container').on('click', (e) => {
        e.preventDefault();
        currdir = './notes';
        if (currentlySelected) {
            currentlySelected.getAttributeNode('class').value = currentlySelected.getAttributeNode('class').value.replace(/\s*note\-highlight\s*/g, '');
            currentlySelected = undefined;
        }
    });

    $('#new-file').on('click', (e) => {
        e.preventDefault();
        view.newFile();
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
        view.delete();
    })

});