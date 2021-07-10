/**
 *  --------------------------------
 *  
 *  Module Description
 * 
 *  --------------------------------
 *  Methods:
 *      FSFactory: (storage:String) -> FS
 *          parameter: 
 *              storage: String
 *                  represents the storage string read from storage.json
 *          return:
 *              an object of type FS that represents the constructed FS instance
 *                  based on the storage string
 *          instantiates a new FS object and returns it as a result,
 *          should be called as FSFactory(storage);
 *      
 *      visualize: (fs:FS, msg?:String) -> undefined
 *          parameter:
 *              fs: FS
 *                  the File System instance that needs to be visualized
 *              msg?: String
 *                  the optional message printed before each visualized nodes
 *          visualizes the provided file system in the console
 *          In particular, it visualizes 
 *              current file cursor, 
 *              current folder cursor,
 *              current root cursor
 *  ----------------
 *  Classes: 
 *      FS: File System representation
 *          properties:
 *              fs.filecursor: 
 *                  points to currently editing document
 *                  undefined if did not open any document
 *              fs.foldercursor: 
 *                  points to current working folder
 *              
 *  ----------------
 *  Errors:
 *      
 *  ----------------
 *  Components: 
 * 
 */

let FSNode = require("./FSNode");
let rootInitDescription = "this is a placeholder value - FSModule.js line 2";
let placeholder = rootInitDescription;

let FSError = function(msg="")  {
    this.name = "File System Error"
    this.msg = msg;
    this.toString = () => this.name + ": " + this.msg;
}

let debug = true;

let log = function(msg) {
    if (debug) console.log("debug at FSModule: " + msg);
}
let loglist = function(nodelist) {
    if (debug) {
        let out = "["
        nodelist.forEach(x => {
            out += (x.path + ", ");
        })
        out += "]";
        console.log(out);
    }
}

let FSFactory = function(storage, tabManager) {
    let buildResult = FSNode.unzip(storage, tabManager);
    let newfs = new FS(buildResult[0], buildResult[1], buildResult[2]);
    Object.defineProperty(newfs, "current", {
        get: function() { return this.getCurrentContent() },
        set: function(newval) { this.saveCurrentFile(newval) },
    })
    return newfs;
}
exports.FSFactory = FSFactory;

/**
 * 
 * @param {FSNode} rootNode JSON-represented FS
 * @param {FSNode} currentlyOpened currently opened node
 * @param {FSNode} openList opened list
 * 
 * Creates a new instance of File System with `new`
 * 
 * Interface: 
 *      
 */
let FS = function(rootNode, currentlyOpened, openList) {
    this.root = rootNode;
    this.filecursor = currentlyOpened;
    this.foldercursor = undefined;
    this.opened = openList;

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

    this.setFileCursorStatus = function(open) {
        if (this.filecursor) this.filecursor.setOpenCloseStatus(open);
    }

    this.setFolderCursorStatus = function(open) {
        if (this.foldercursor) this.foldercursor.setOpenCloseStatus(open);
    }

    this.resetFolderCursor = function(node) { this.foldercursor = node; };

    this.getCurrentContent = function() {
        if (this.hasFileCursor() )  {
            return this.filecursor.getContent();
        } else {
            return rootInitDescription;
        }
    }

    this.updateFileTODO = function(todolist) {
        if (this.hasFileCursor()) {
            this.filecursor.todos = todolist;
        } else {
            throw new FSError("FSModule.updateFileTODO(): do not have a file cursor");
        }
    };

    this.getWorkingFolder = function() {
        if (!this.hasFileCursor()) {
            return this.foldercursor;
        } else {
            if (this.filecursor.parent.isFile()) {
                throw new FSError("FSModule.getWorkingFolder(): unexpected file nested within file.");
            } else 
            if (this.filecursor.parent == undefined) {
                throw new FSError("FSModule.getWorkingFolder(): null parent exception");
            } else {
                return this.filecursor.parent;
            }
        }
    }

    this.getSelectedFolder = function() {
        return this.foldercursor;
    }

    this.saveCurrentFile = function(content) {
        if (!this.hasFileCursor()) throw new FSError("FSModule.saveCurrentFile(): no cursor opened");
        this.filecursor.setContent(content);
        // return this.filecursor;
    }

    this.createFilePrimitive = function() {
        let parent = this.getSelectedFolder();
        let name = "untitled ";
        if (parent.hasChildFile(name)) {
            log("FSModule.createFilePrimitive(): already have name " + name);
            let counter = 1;
            while (parent.hasChildFile(name + counter)) {
                counter += 1;
            }
            name += counter;
        }

        let node = new FSNode.FSNode(name, FSNode.Type.file, placeholder);
        this.filecursor = node;
        parent.addChild(node, true);
        parent.setOpen();
    }

    // deprecated, need to change it in future
    this.renameFile = function(newname) {
        if (this.filecursor) {
            return this.filecursor.rename(newname);
        } else {
            return false;
        }
    }

    // deprecated, need to change it in future
    this.renameFolder = function(newname) {
        if (this.foldercursor) {
            return this.foldercursor.rename(newname);
        } else {
            return false;
        }
    }

    /**
     * 
     * @param {FSNode.FSNode} node node that need to be relocated
     * @param {String} newpath new path string
     */
    this.relocateFile = function(node, newpath) {
        if (!node.renamable) return;
        if (!node.parent) return;

        node.parent.deleteChild(node);
        let curr = this.root;
        if (newpath[0] == "/") newpath = newpath.substring(1);
        let paths = newpath.split("/");
        let plen = paths.length;
        paths.forEach((x, idx) => {
            // is a file name
            if (idx == plen - 1) {
                let newname = x;
                if (curr.hasChildFile(newname)) {
                    let i = 1;
                    while (curr.hasChildFile(newname + i)) {
                        i += 1;
                    }
                    newname += i;
                }
                node.setName(newname);
                curr.addChild(node, true);
                node.updateChildrenPath();
            } 

            // is a folder name
            else {
                curr = curr.findOrCreateChildFolder(x);
                curr.setOpen();
                if (!this.opened.includes(curr)) this.opened.push(curr);
            }
        });
    }

    /**
     * 
     * @param {FSNode.FSNode} node new folder node that needs to be relocated
     * @param {String} newpath new path for the folder node
     */
    this.relocateFolder = function(node, newpath) {
        if (!node.renamable) return;
        if (!node.parent) return;

        console.log("folder cursor: " + this.foldercursor.path);
        node.parent.deleteChild(node);
        
        let curr = this.root;
        if (newpath[0] == "/") newpath = newpath.substring(1);
        let paths = newpath.split("/");
        let plen = paths.length;
        paths.forEach((x, index) => {
            //  first find or create the path
            //  and check if current x is the last item in list
            //  if is last item, then we check if current node has a children of the same name as node
            //      if has same name, then we migrate all children under current node to this node
            //      else, we add current node as a child of curr
            //  else, directly enter next loop
            if (index == plen-1) {
                // indicates that there already has a folder with same name, migrate all children to this node
                if (curr.hasChildFolder(x)) {
                    curr = curr.findOrCreateChildFolder(x);
                    node.migrate(curr);
                    return;
                } 
                // no duplicate name found, add node as a child of curr
                else {
                    node.setName(x);
                    curr.addChild(node, true);
                    node.updateChildrenPath();
                }
            } else {
                curr = curr.findOrCreateChildFolder(x);
                curr.setOpen();
                if (!this.opened.includes(curr)) this.opened.push(curr);
            }
        });
    }

    this.createFile = function(currentValue) {
        if (this.filecursor) {
            this.saveCurrentFile(currentValue);
            this.filecursor.setClose();
        }
        this.createFilePrimitive();

        log("FSModule.createFile(): created file: " + FSNode.zip([this.filecursor, ]));

        this.filecursor.setOpen();
        this.filecursor.selected = true;
        return true;
        // return .content;
    }

    //  add a new folder:   create a new folder node under current selected folder:
    //                      append this newly-created folder to current folder
    //                      and navigate to this newly-created folder
    this.createFolder = function() {
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
        parent.addChild(node, true);
        parent.setOpen();
        return true;
        // return node;
    }

    this.deleteNodePrimitive = function(node) {
        node.destructTabs();
        node.parent.deleteChild(node);
    }

    this.deleteGivenNode = function(node) {
        if (!node.deletable) return;

        if (this.folderCursorInNode(node)) {
            if (this.fileCursorInFolderCursor()) {
                this.filecursor = undefined;
            }
            this.foldercursor = this.root;
        }

        if (this.filecursor == node) {
            this.filecursor = undefined;
        }

        this.deleteNodePrimitive(node);
    }

    this.folderCursorInNode = function(node) {
        if (this.foldercursor) {
            let cursor = this.foldercursor;
            while (cursor) {
                if (cursor == node) {
                    return true;
                }
                cursor = cursor.parent;
            }
        }
        return false;
    }

    this.fileCursorInFolderCursor = function() {
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

    this.getDB = function() {
        return this.root.children;
    }

    this.resetToRoot = function() {
        this.foldercursor = this.root;
    }

    /**
     * returns {FSNode[]} a list of nodes with type File
     */
    this.collectFiles = function() {
        return this.root.collectChildFile();
    }

    this.export = function() {
        return FSNode.zip(this.root.children);
    }

    /**
     * 
     * @param {TabInstance} tag 
     */
    this.addTag = (tag) => {
        if (this.filecursor) {
            console.log("Adding tag: " + tag.name + " to File: " + this.filecursor.getCanonicalName());
            tag.addChild(this.filecursor);
        }
    }

    this.deleteTag = (tag) => {
        if (this.filecursor) {
            tag.deleteChild(this.filecursor);
        }
    }

    this.getTags = () => {
        if (this.filecursor) {
            return this.filecursor.tabs;
        } else {
            return [];
        }
    }
};
exports.FS = FS;

/**
 * 
 * @param {FS} fs fs to visualize
 */
let visualize = function(fs, msg="") {
    if (debug) {
        console.log("----------------Visualizing FS----------------");
        console.log(msg);
        console.log("--------\nFile Cursor:")
        console.log(fs.filecursor?FSNode.visualizer(fs.filecursor):"undefined");
        console.log("--------\nFolder Cursor:")
        console.log(fs.foldercursor?FSNode.visualizer(fs.foldercursor):"undefined");
        console.log("--------\nRoot:");
        console.log(FSNode.visualizer(fs.root));
    }
}
exports.visualize = visualize;

Vue.component("fs-module", {
    props: ["initfs"],
    data: function() {
        return {
            fs: this.initfs,
        }
    },
    methods: {
        log: function(e) {
            console.log(e);
        },
        /**
         * 
         * @param {FSNode.FSNode} clicked 
         */
        nodeClickHandler: function(clicked) {
            if (clicked.isFolder()) {
                clicked.toggleOpen();
                this.fs.resetFolderCursor(clicked);
            } else {
                if (!clicked.opened) {
                    this.fs.setFileCursorStatus(false);
                    this.fs.resetFileCursor(clicked);
                    this.fs.setFileCursorStatus(true);
                    this.$emit("switch-note", this.fs.current);
                }
            }
            if (this.fs.filecursor) {
                this.$emit("bring-editor-to-front");
            }
        },
        nodeRelocationHandler: function(node, newpath) {
            log("Handling Relocation inside FSModule: \n--------");
            log(node);
            log(newpath);
            visualize(this.fs, `Relocating node ${node.path} -> ${newpath}`);
            if (node.isFile()) {
                this.fs.relocateFile(node, newpath);
            } else {
                this.fs.relocateFolder(node, newpath);
            }
        },
        nodeDeleteHandler: function(node) {
            log("Handling Node Deletion inside FSModule: \n--------");
            log("Deleting node: " + node.getCanonicalName());
            this.fs.deleteGivenNode(node);
            visualize(this.fs, `After Deletion of node ${node.path}`);
            if (!this.fs.filecursor) this.$emit("clear-editor");
        },
    },
    template: `
        <div>
            <fs-node 
                v-for="child in fs.getDB()"
                :fsnode="child"
                :key="child.path"
                @relocate-node="nodeRelocationHandler"
                @delete-node="nodeDeleteHandler"
                @click-node="nodeClickHandler">
            </fs-node>
        </div>
    `
})

