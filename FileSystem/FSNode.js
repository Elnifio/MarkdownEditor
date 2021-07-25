/**
 * Node type enum: either File or Folder, referred as module.Type
 */
let Type = {
    file: "file",
    folder: "folder",
}
exports.Type = Type;

let Color = {
    default: "no-color"
}
exports.Color = Color;

let PathSep = "/";
exports.PathSeparator = PathSep;

let debug = false;

let FSNodeError = function(msg) {
    this.name = "FSNode Error"
    this.msg = msg;
    this.toString = () => this.name + ": " + this.msg;
}

let log = function(msg) {
    if (debug) {
        console.log("debug at FSNode: " + msg);
    }
}

let visualizer = function(unzipped) {
    return vishelper(unzipped);
}
exports.visualizer = visualizer;

let vishelper = function(unzipped, indent="") {
    let out = `${indent}${unzipped.type}: ${unzipped.name}, ${unzipped.opened?"open":"close"};\n`
    unzipped.children.forEach((x, index) => {
        out += (vishelper(x, indent + " | "));
    })
    return out;
}

/**
 * 
 * @param {FSNode[]} unzipped unzipped root node list
 */
let zip = function(unzipped) {
    return JSON.stringify(unzipped.map(ziphelper));
}
exports.zip = zip;

/**
 * 
 * @param {FSNode} unzipped unzipped general FSNode
 */
let ziphelper = function(unzipped) {
    return [unzipped.name, 
            unzipped.type, 
            unzipped.content, 
            unzipped.opened, 
            unzipped.children.map(ziphelper), 
            {todos: unzipped.todos, tabs: unzipped.zipTabs()}];
}

/**
 * 
 * @param {String} zipped zipped string
 */
let unzip = function(zipped, tabManager) {
    let nodes;
    try {
        nodes = JSON.parse(zipped);
    } catch(err) {
        throw new FSNodeError("FSNode.unzip() JSON parsing error from node storage: " + err);
    }

    // cumulative children, lastOpened, and OpenedFolders
    let children = [];
    let opens = {
        lastOpened: undefined,
        openedFolders: [],
    }
    // unzipped result for x
    let xres;
    let root = new FSNode("", Type.folder, "", true, children, undefined);
    nodes.forEach(x => {
        xres = unziphelper(x, "", tabManager);
        // children = children.concat(xres[0]);
        root.addChild(xres[0]);
        opens.lastOpened = (xres[1])?xres[1]:opens.lastOpened;
        opens.openedFolders = opens.openedFolders.concat(xres[2]);
    })
    root.deletable = false;
    return [root, opens.lastOpened, opens.openedFolders];
}
exports.unzip = unzip;

/**
 * 
 * @param {FSNode[]} zipped a list of objects of form [<name>, <type>, <content>, <opened>, [...children]]
 * @param {String} path default path of this node
 * @param {TabManager} 
 */
let unziphelper = function(zipped, path, tabManager) {
    // [ <root>, <last-opened-file>, [<opened-folder-path>, ...]]
    let returned = [undefined, undefined, []];
    // [<name>, <type>, <content>, <opened>, [...children], {todos: [...todo-items], }]
    let newpath = path + PathSep + zipped[0];

    let out = new FSNode(
        zipped[0], 
        zipped[1], 
        zipped[2], 
        zipped[3], 
        [], 
        undefined, 
        newpath, 
        zipped.length==6?zipped[5].todos:[]);
    
    if (zipped[5] && zipped[5].tabs) {
        zipped[5].tabs.forEach(x => tabManager.findTab(x).addChild(out));
    }

    returned[0] = out;

    if (out.opened) {
        if (out.type == Type.file) {
            returned[1] = out;
        } else {
            returned[2].push(out);
        }
    }

    let result;
    zipped[4].forEach( (child) => {
        result = unziphelper(child, newpath, tabManager);
        out.addChild(result[0]);
        if (result[1]) returned[1] = result[1];
        returned[2] = returned[2].concat(result[2]);
    })

    return returned;
}

let id = 0;

/**
 * 
 * @param {String} name         : name of the node
 * @param {Type} type           : type of the node, choose from module.Type
 * @param {String} content      : content of the node, ignored if type==folder
 * @param {Boolean} opened      : status: is the node opened?
 * @param {FSNode[]} children   : children of this node, ignored if type==file
 * @param {FSNode} parent       : parent of this node
 * @param {String} path         : path of this node
 */
let FSNode = function(name, type, content="", opened=false, children=[], parent=undefined, path="", todos=[], tabs=[]) {
    id += 1;
    this.id = id;
    this.name=name;
    this.type=type;
    this.content=content;
    this.opened=opened;
    this.children=children;
    this.parent=parent;
    this.path = path;
    this.todos = todos;
    this.tabs = tabs

    this.selected = false;
    this.description = "";
    this.deletable = true;
    this.renamable = true;
    this.pathsep = PathSep;


    this.setOpen = function() { this.opened = true; };
    this.setClose = function() { this.opened = false; };
    this.setOpenCloseStatus = function(status) { this.opened = status; }
    this.getName = function() { return this.name + "-" + this.type; };
    this.getCanonicalName = function() { return this.name; };
    this.setName = function(newname)  { this.name = newname; };
    
    this.addTab = (tab) => { 
        this.tabs.push(tab);
        console.log(this.tabs);
    };
    this.deleteTab = (tab) => {
        let idx = this.tabs.indexOf(tab);
        console.log(this.tabs);
        if (idx < 0) {
            throw new FSNodeError(`FSNode.deleteTab(): Cannot find tab ${tab.name}`);
        } else {
            this.tabs.splice(idx, 1);
        }
    }
    this.destructTabs = () => {
        this.tabs.forEach(x => x.deleteChild(this));
    }

    this.zipTabs = () => this.tabs.map(tab => tab.name);

    this.isFile = function() { return this.type == Type.file; } 
    this.isFolder = function() { return this.type == Type.folder; }

    /**
     * insert a child node under current node
     * @param {FSNode} child child node that needs to be updated
     */
    this.addChild = function(child, updatePath=false) {
        this.children.push(child);
        child.parent = this;
        if (updatePath) child.activeUpdateSelfPath();
    }

    /**
     * 
     * @param {FSNode} child child node that needs to be deleted
     */
    this.deleteChild = function(child) {
        let idx = this.children.indexOf(child);
        if (idx < 0) {
            throw new FSNodeError(`FSNode.deleteChild(): Cannot find child ${child.getCanonicalName()} with path ${child.path} in current node with name ${this.getCanonicalName()}`);
        } else {
            child.parent = undefined;
            this.children.splice(idx, 1);
        }
    }

    /**
     * 
     * @param {FSNode} target target node that `this` migrates its children to
     */
    this.migrate = function(target) {
        if (target.isFolder()) {
            this.children.forEach(x => {
                target.addChild(x, true);
            })
            this.children = [];
        }
    }

    this.findOrCreateChildFolder = function(childName) { 
        let out = this.filterNodeByName(childName + "-" + Type.folder)[0];
        if (out) {return out;}
        else { 
            out = createFolder(childName);
            out.passiveUpdateSelfPath(this.path);
            this.addChild(out);
            return out; 
        } 
    }

    /**
     * 
     * @param {String} childName name of the child file
     * @returns boolean if the file name exist
     */
    this.hasChildFile = function(childName) { return this.filterNodeByName(childName + "-" + Type.file).length == 1; }

    /**
     * 
     * @param {String} childName name of the child folder
     * @returns boolean if the folder name exist
     */
    this.hasChildFolder = function(childName) { return this.filterNodeByName(childName + "-" + Type.folder).length == 1;}

    /**
     * 
     * @param {String} fullname name of the child node to be searched
     * @returns FSNode[] 0-or-1 length array, either contains the child or not
     */
    this.filterNodeByName = function(fullname) {
        if (debug) {
            let fresult = this.children.filter(x => x.getName() == fullname);
            log(`found ${fresult.length} results for ${fullname} under node ${this.path}`);
            if (fresult.length > 1) {
                throw new FSNodeError(`Duplicate child file ${fullname} found at folder ${this.path}`);
            } else {
                return fresult;
            }
        } else {
            return this.children.filter(x => x.getName() == fullname);
        }
    }

    // deprecated, need to be changed
    this.rename = function(new_name) {
        if (this.parent== undefined) {
            this.name = new_name;
            return true;
        }

        if (this.type == Type.file) {
            if (this.parent.hasChildFile(new_name)) {
                return false;
            } else {
                this.name = new_name;
                this.parent.deleteChild(this);
                this.parent.addChild(this);
                return true;
            }
        } else {
            if (this.parent.hasChildFolder(new_name)) {
                return false;
            }
            else {
                this.name = new_name;
                this.parent.deleteChild(this);
                this.parent.addChild(this);
                return true;
            }
        }
    }

    /**
     * actively query self's parents to find current path, complexity O(log N)
     * @returns this.path: String
     */
    this.activeUpdateSelfPath = function() {
        let cursor = this.parent;
        // handler for root element edge case
        if (!cursor) return ""; 
        this.path = this.getCanonicalName();
        while (cursor.parent != undefined) {
            this.path = cursor.getCanonicalName() + this.pathsep + this.path;
            cursor = cursor.parent;
        }
        return this.path;
    }

    /**
     * passively updates self's path based on provided new path
     * @param {String} newpath new path that needs to be updated
     */
    this.passiveUpdateSelfPath = function(newpath) {
        this.path = newpath + this.pathsep + this.getCanonicalName();
    }

    /**
     * In-order traversal update of children's path, complexity O(N)
     */
    this.updateChildrenPath = function() {
        this.children.forEach(
            /**
             * children path update iterator
             * @param {FSNode} x each child representation
             */
            x => {
            x.passiveUpdateSelfPath(this.path);
            x.updateChildrenPath();
        })
    }

    // Get & set for content
    this.getContent = function() { return this.content; }
    this.setContent = function(new_content) { this.content = new_content; }
    this.updateAtIndex = function(index, newcontent) { this.content = this.content.substring(0, index.start) + newcontent + this.content.substring(index.end); }

    this.toggleOpen = function() {
        this.opened = !this.opened;
    }

    this.lock = function() {
        this.deletable = false;
        this.renamable = false;
    }

    this.unlock = function() {
        this.deletable = true;
        this.renamable = true;
    }

    this.collectChildFile = function() {
        return this.children.filter(
            x => x.isFolder()
            ).reduce(
                (accumulator, current) => accumulator.concat(current.collectChildFile()), this.children.filter(x => x.isFile())
                );
    }

    this.reportTODOCount = function() {
        // if a TODO is finished, then add it by 0, else add it by 1 + number of unfinished items in actions
        return this.todos.reduce(
            (accumulator, currentvalue) => 
                accumulator + (1 + currentvalue.actions
                    .filter(x => !x.status).length) // Calculate: 1 (self) + number of all items where status != true
                    * !currentvalue.status,
            0);
    }

    this.reportTODOProgress = function() {
        if (this.todos.length == 0) {
            return 100;
        } else {
            return this.todos.reduce((accumulator, currentvalue) => {
                if (currentvalue.actions.length == 0) {
                    return currentvalue.status * 100 + accumulator;
                } else if (currentvalue.status) {
                    return accumulator + 100;
                } else {
                    return accumulator + (currentvalue.actions.reduce((accu, currval) => accu + currval.status * 100, 0) / currentvalue.actions.length);
                }
            }, 0) / this.todos.length;
        }
    }
}
exports.FSNode = FSNode;

let createFile = function(name, opened=false, content="") {
    return new FSNode(name, Type.file, content, opened);
}

let createFolder = function(name, opened=false, content="") {
    return new FSNode(name, Type.folder, content, opened);
}

exports.createFile = createFile;

exports.createFolder = createFolder;

Vue.component("fs-node", {
    props: ["fsnode"],
    data: function() {
        return {
            node: this.fsnode,
            menu: false,
            nodepath: this.fsnode.path,
        }
    },
    methods: {
        log: function(event) {
            console.log(event);
        },
        propagateNodeRelocate: function(node, newpath) {
            this.$emit("relocate-node", node, newpath);
        },
        propagateDeleteNode: function(node) {
            this.$emit("delete-node", node);
        },
        clickNode: function() {
            this.$emit("click-node", this.node);
        },
        propagateClickNode: function(node) {
            this.$emit("click-node", node);
        },
        pathchecker: value => {
            let newval = value;
            if (value[0] == "/") newval = value.substring(1);
            return !newval.split("/").includes("") || "Path item should be of form \"/<folder-name>\""
        },
        sendUpdate: function(menuOpen) {
            console.log(menuOpen);
            console.log(`configured node path: ${this.nodepath}`);
            console.log(`actual node path: ${this.node.path}`);
            if (!menuOpen && this.nodepath != this.node.path) {
                console.log("sending update");
                this.$emit("relocate-node", this.node, this.nodepath);
            } else return;
        },
        updatePath: function(newpath) {
            this.nodepath = newpath;
        },
        sendDelete: function(event) {
            this.menu=false;
            this.$emit("delete-node", this.node);
        }
    },
    template: `
    <div class="ml-2">
        <v-menu
        v-model="menu"
        :close-on-content-click="false"
        offset-x
        @input="sendUpdate">
            <template v-slot:activator="{ on, attrs }">
                <v-hover v-slot="{ hover }">
                    <div dense :elevation="0" @click="clickNode" @contextmenu="menu=!menu" :class="hover?'grey lighten-4':''">
                        <div>
                            <v-icon v-if="node.isFile()"> {{ node.opened? 'mdi-file-edit-outline' : 'mdi-file-outline' }} </v-icon>
                            <v-icon v-else> {{ node.opened? 'mdi-chevron-down' : 'mdi-chevron-right' }} </v-icon>
                            <span class="unselectable">{{ node.getCanonicalName() }}</span>
                        </div>
                    </div>
                </v-hover>
            </template>

            <v-card>
                <v-card-title>
                    <v-text-field 
                        dense 
                        label="Storage Path" 
                        @change="updatePath" 
                        v-model="nodepath"
                        ref="newpath"
                        :readonly="!node.renamable"
                        :rules="[ () => !!nodepath || 'Required.', pathchecker]"
                        :hint="'New Path: ' + nodepath">
                    </v-text-field>
                </v-card-title>

                <v-card-actions>
                    <v-row align="center" justify="end">
                        <v-btn 
                            color="warning" 
                            text 
                            @click.prevent="sendDelete" 
                            :disabled="!node.deletable">
                                <v-icon>mdi-trash-can-outline</v-icon> Delete 
                            </v-btn>
                    </v-row>
                </v-card-actions>
            </v-card>
        </v-menu>
            
        <div v-if="node.opened && node.isFolder()" class="d-flex">
            <v-divider vertical class="mx-2"></v-divider>
            <div class="flex-grow-1 flex-shrink-1">
                <fs-node
                    v-for="child in node.children"
                    :fsnode="child"
                    :key="child.path"
                    @relocate-node="propagateNodeRelocate"
                    @delete-node="propagateDeleteNode"
                    @click-node="propagateClickNode"
                    >
                </fs-node>
            </div>
        </div>
    </div>
    `
})

/*
Vue.component("fs-node-menu", {
    props: ["initval"],
    data: function() {
        return {
            node: this.initval,
            nodepath: this.initval.path,
            open: false,
        }
    },
    methods: {
        log: function(event) {
            console.log(event);
        },
        pathchecker: value => {
            let newval = value;
            if (value[0] == "/") newval = value.substring(1);
            return !newval.split("/").includes("") || "Path item should be of form \"/<folder-name>\""
        },
        sendUpdate: function(menuOpen) {
            console.log(menuOpen);
            console.log(`configured node path: ${this.nodepath}`);
            console.log(`actual node path: ${this.node.path}`);
            if (!menuOpen && this.nodepath != this.node.path) {
                console.log("sending update");
                this.$emit("relocate-node", this.node, this.nodepath);
            } else return;
        },
        updatePath: function(newpath) {
            this.nodepath = newpath;
        },
        sendDelete: function(event) {
            this.open=false;
            this.$emit("delete-node", this.node);
        }
    },
    template: `
        <v-menu 
            v-model="open" 
            :close-on-content-click="false" 
            offset-x
            @input="sendUpdate">
            <template v-slot:activator="{ on, attrs }">
                <v-btn v-bind="attrs" v-on="on" icon>
                    <v-icon>mdi-dots-horizontal</v-icon>
                </v-btn>
            </template>

            <v-card>
                <v-card-title>
                    <v-text-field 
                        dense 
                        label="Storage Path" 
                        @change="updatePath" 
                        v-model="nodepath"
                        ref="newpath"
                        :readonly="!node.renamable"
                        :rules="[ () => !!nodepath || 'Required.', pathchecker]"
                        :hint="'New Path: ' + nodepath">
                    </v-text-field>
                </v-card-title>
                <v-card-actions>
                    <v-row align="center" justify="end">
                        <v-btn color="warning" text @click.prevent="sendDelete" :disabled="!node.deletable"><v-icon>mdi-trash-can-outline</v-icon> Delete </v-btn>
                    </v-row>
                </v-card-actions>
            </v-card>
        </v-menu>
    `,
})
*/