let FSNode = require("./FSNode");
let rootInitDescription = "this is a placeholder value - FSModule.js line 2";
let placeholder = rootInitDescription;

let FSError = function(msg="")  {
    this.name = "File System Error"
    this.msg = msg;
    this.toString = () => this.name + ": " + this.msg;
}

/**
 * 
 * @param {String} storage JSON-represented FS
 * 
 * Creates a new instance of File System with `new`
 * 
 * Interface: 
 *      
 */
let FS = function(storage) {
    this.root = undefined;
    this.filecursor = undefined;
    this.foldercursor = undefined;

    let buildResult = FSNode.unzip(storage);
    this.root = buildResult[0];
    this.root.setOpen();

    this.filecursor = buildResult[1];
    this.hasFileCursor = function() { return this.filecursor != undefined; }

    this.foldercursor = (this.hasFileCursor()?(this.filecursor.parent):(this.root));


    if (this.hasFileCursor()) { 
        this.filecursor.setOpen(); 
        this.filecursor.selected = true;
    }

    this.resetFileCursor = function(node) {
        this.filecursor = node;
        this.foldercursor = this.getWorkingFolder();
    }

    this.resetFolderCursor = function(node) { this.foldercursor = node; };

    this.getCurrentContent = function() {
        if (this.hasFileCursor() )  {
            return this.filecursor.getContent();
        } else {
            return rootInitDescription;
        }
    }

    this.getWorkingFolder = function() {
        if (!this.hasFileCursor()) {
            return this.foldercursor;
        } else {
            if (this.filecursor.parent.isFile()) {
                throw new FSError("unexpected file nested within file.");
            } else 
            if (this.filecursor.parent == undefined) {
                throw new FSError("null parent exception");
            } else {
                return this.filecursor.parent;
            }
        }
    }

    this.getSelectedFolder = function() {
        return this.foldercursor;
    }

    this.saveCurrentFile = function(content) {
        if (!this.hasFileCursor()) throw new FSError("no cursor opened");
        this.filecursor.setContent(content);
        return this.filecursor;
    }

    this.createFilePrimitive = function() {
        let parent = this.getSelectedFolder();
        let name = "untitled ";
        if (parent.hasChildFile(name)) {
            console.log("already have name " + name);
            let counter = 1;
            while (parent.hasChildFile(name + counter)) {
                counter += 1;
            }
            name += counter;
        }

        let node = new FSNode.FSNode(name, FSNode.Type.file, placeholder);
        this.filecursor = node;
        parent.addChild(node);
        parent.setOpen();
        return node;
    }

    this.renameFile = function(newname) {
        if (this.filecursor) {
            return this.filecursor.rename(newname);
        } else {
            return false;
        }
    }

    this.renameFolder = function(newname) {
        if (this.foldercursor) {
            return this.foldercursor.rename(newname);
        } else {
            return false;
        }
    }

    this.createFile = function(currentValue) {
        this.resetSelected();
        let current;
        if (this.filecursor) {
            current = this.saveCurrentFile(currentValue);
            current.setClose();
        }
        current = this.createFilePrimitive();

        console.log("--------\nnewly-created File: ");
        console.log(FSNode.zip(current));
        
        current.setOpen();
        current.selected = true;
        return current.content;
    }

    //  add a new folder:   create a new folder node under current selected folder:
    //                      append this newly-created folder to current folder
    //                      and navigate to this newly-created folder
    this.createFolder = function() {
        this.resetSelected();
        let parent = this.getSelectedFolder();
        let name = "undefined";
        if (parent.hasChildFolder(name)) {
            let counter = 1;
            while (parent.hasChildFolder(name + counter)) {
                counter += 1;
            }
            name = name + counter;
        }

        let node = new FSNode.FSNode(name, FSNode.Type.folder);
        this.foldercursor = node;
        parent.addChild(node);
        parent.setOpen();
        return node;
    }

    // delete currently selected file and set filecursor to be undefined
    // silently fail if filecursor is undefined
    this.deleteFile = function() {
        if (this.filecursor) {
            this.deleteNodePrimitive(this.filecursor);
            this.filecursor = undefined;
        }
    }

    this.deleteNodePrimitive = function(node) {
        node.parent.deleteChild(node);
    }

    // delete currently selected folder and set foldercursor to be root
    // silently fail if: 
    //      foldercursor is undefined
    //      foldercursor is root
    // if currently editing file is also in foldercursor, 
    // we also select filecursor as undefined
    this.deleteFolder = function() {
        // edge cases
        if (!this.foldercursor) return;
        if (this.foldercursor == this.root) return;

        // file cursor inside folder cursor
        if (this.in()) {
            this.filecursor = undefined;
        }
        this.deleteNodePrimitive(this.foldercursor);
        this.foldercursor = this.root;
    }

    this.in = function() {
        if (this.filecursor && this.foldercursor) {
            let cursor = this.filecursor;
            while (cursor) {
                if (cursor == this.foldercursor) {
                    return true;
                }
                cursor = cursor.parent;
            }
        }
        return false;
    }

    this.resetSelected = function() {
        if (this.filecursor) this.filecursor.selected = false;
        if (this.foldercursor) this.foldercursor.selected = false;
    }
};
exports.FS = FS;

Vue.component("fsmodule", {
    props: ["initfs"],
    data: function() {
        return {
            fs: this.initfs,
        }
    },
    methods: {
        log: function(e) {
            console.log(FSNode.zip(e));
            this.$emit("file-clicked", e)
        },
        clickHandler: function(node) {
            this.fs.resetSelected();
            node.selected = true;
            if (node.type == FSNode.Type.folder) {
                this.fs.resetFolderCursor(node);
                if (node == this.fs.root) node.setOpen();
            } else {
                let out = (currentValue) => {
                    if (this.fs.hasFileCursor()) {
                        let current = this.fs.saveCurrentFile(currentValue);
                        current.setClose();
                    }
                    this.fs.resetFileCursor(node);
                    node.setOpen();
                    return node.content;
                }
                this.$emit("update-content", out)
            }
            console.log(`Current folder: ${this.fs.foldercursor?this.fs.foldercursor.name:undefined}`);
            console.log(`Current file: ${this.fs.filecursor?this.fs.filecursor.name:undefined}`);
            console.log(`In? ${this.fs.in()}`);
        },

        
    },

    template: `
        <div>
            <h1>File System</h1>
            <hr />
            <fsnode :node="fs.root" @click-handler="clickHandler"></fsnode>
        </div>
    `
})