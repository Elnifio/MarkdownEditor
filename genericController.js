/**
 * Generic Controller should only be in charge of file controller and editor controller
 * on each update, it will notify file & editor controller, and they respond with corresponding actions
 */
import FileController from './FileSystem/fileController.js';
import EditorController from './EditorControl/editorController.js';

let REFRESH = 10; // refresh every REFRESH seconds
let OFFSET = 40;

/**
 *  Variable declaration area:
 *      finds all necessary components
 */
// files and utilities section
let fileUtilityContainer    = document.getElementById('file-utility-container');
let utilityContainer        = document.getElementById('utility-container');
let fileContainer           = document.getElementById('file-container');

// toolbars section
let toolbars                = document.getElementById('toolbars');
let folderToolbars          = document.getElementById('utility-container');
let toolbarDocumentSection  = document.getElementById('toolbar-document-container');
let newfile                 = document.getElementById("new-file");

let hidden                  = document.getElementById('hidden');

// editor & display section
let editorContainer         = document.getElementById('editor-container');
let editor                  = document.getElementById('editor');
let displayContainer        = document.getElementById('display-container');
let mainContainer           = document.getElementById('main-container');

let body                    = document.body;

let Controller = function(fileC, editorC) {
    fileC.registerListener(this);
    editorC.registerListener(this);
    let start = new Date();
    /**
     * Initiate folder view: file controller should handle that, 
     * and returns a function that renders fileContainer
     */
    fileC.render()(fileContainer);

    /**
     * update editor: notify editor controller
     * editor.onupdate(): e->editorC.updateText(editor, displayContainer);
     */
    let notifyController = (value) => editorC.updateText(value)(editor, displayContainer);
    editor.addEventListener('input', (e) => { 
        notifyController(editor.value); 
    });

    this.getContent = function() {
        return editor.value;
    }

    this.updateContent = function(updator) {
        notifyController(updator(this.getContent()));
    }

    /**
     * Every set interval: update current page content
     */
    let listener = setInterval(() => {
        let time = new Date();
        if (time - start >= REFRESH * 1000) {
            notifyController(editor.value);
            start = time;
        }
    }, 1000);
    this.stopIter = () => { clearInterval(listener); }

    /** 
     * height update function
     */
    let height;
    let adjustHeight = function() {
        height = window.innerHeight - toolbars.clientHeight - OFFSET;
        editor.style.height = `${height}px`;
        displayContainer.style.maxHeight = `${height}px`;
        mainContainer.style.maxHeight = `${window.innerHeight - OFFSET}px`;

        height = fileUtilityContainer.clientHeight - utilityContainer.clientHeight;
        fileContainer.style.height = `${height}px`;

        body.scrollIntoView({block: "start", inline: "nearest"});
    }

    newfile.addEventListener("click", (e) => {
        e.preventDefault();
        this.updateContent(fileC.createFile());
    })

    /**
     * On initiate: update the editor content
     */
    notifyController(fileC.queryContent());
    // adjustHeight();
    // window.addEventListener('resize', () => adjustHeight());
}

let fc = new FileController.controller();
let ec = new EditorController();
let c = new Controller(fc, ec);

const fs = require('fs');

// testing of the newfile function 
for (let i = 0; i < 50; i ++) {
    newfile.click();
}

// on close event:
require('electron').ipcRenderer.on('close', (event) => {
    fs.writeFileSync('./test.txt', 'test for writing files');
})


