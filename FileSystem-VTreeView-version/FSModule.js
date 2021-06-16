const { TouchBarScrubber } = require("electron");
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

let FSFactory = function(storage) {
    let buildResult = FSNode.unzip(storage);
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
            console.log(this.filecursor);
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
        parent.addChild(node);
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

    this.createFile = function(currentValue) {
        this.resetSelected();
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
        return true;
        // return node;
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

    this.getDB = function() {
        return this.root.children;
    }

    this.resetToRoot = function() {
        this.foldercursor = this.root;
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
            console.log(e);
        },
        /**
         * 
         * @param {FSNode.FSNode[]} openedList a list of nodes that are open
         */
        folderClickHandler: function(openedList) { 
            console.log(openedList);
            console.log(this.fs.opened);
            let closedNode = this.fs.opened.filter(x => !openedList.includes(x));
            let openedNode = openedList.filter(x => !this.fs.opened.includes(x));
            if ((closedNode.length > 1 || openedNode.length > 1)) {
                log("Opened node or closed node contain more than one item:");
                loglist(closedNode);
                loglist(openedNode);
                throw new FSError("Opened node or closed node contain more than one item");
            }
            if (closedNode.length >=1 && openedNode.length >= 1) {
                log("Opened node and closed node do not agree:");
                loglist(closedNode);
                loglist(openedNode);
                throw new FSError("Opened node or closed node do not agree");
            } else if (closedNode.length == 1) {
                this.fs.resetFolderCursor(closedNode[0]);
            } else if (openedNode.length == 1) {
                this.fs.resetFolderCursor(openedNode[0]);
            } else {
                log("did not find a different item: ");
            }
            log("set new folder cursor as " + this.fs.getSelectedFolder().path);
            this.fs.opened = openedList;
        },

        /**
         * 
         * @param {FSNode.FSNode} newnode 
         */
        fileClickHandler: function(newnode) {
            console.log("Clicking node:");
            console.log(newnode);
            this.fs.resetFileCursor(newnode[0]);
            // TODO: 修复无法切换笔记的bug
        }
    },

    template: `
        <div>
            <v-treeview
                :items="fs.getDB()"
                :open="fs.opened"
                activatable
                item-key="path"
                open-on-click
                dense
                shaped
                color="primary"
                return-object
                @update:active="fileClickHandler"
                @update:open="folderClickHandler">

                <template v-slot:prepend="{ item, open }">
                    <template v-if="item.isFile()">
                        <v-icon color="primary">{{ item.opened? 'mdi-file-edit-outline' : 'mdi-file-outline' }}</v-icon>
                    </template>
                    <template v-else>
                        <v-icon color="primary">{{ item.opened? 'mdi-folder-open-outline' : 'mdi-folder-outline' }}</v-icon>
                    </template>
                </template>

                <template v-slot:label="{ item, open }">
                    {{ item.getCanonicalName() }}
                </template>
            </v-treeview>
        </div>
    `
})