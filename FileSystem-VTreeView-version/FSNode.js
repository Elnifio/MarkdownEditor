/**
 * Node type enum: either File or Folder, referred as module.Type
 */
let Type = {
    file: "file",
    folder: "folder",
}
exports.Type = Type;

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
    return [unzipped.name, unzipped.type, unzipped.content, unzipped.opened, unzipped.children.map(ziphelper)];
}

/**
 * 
 * @param {String} zipped zipped string
 */
let unzip = function(zipped) {
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
        xres = unziphelper(x);
        // children = children.concat(xres[0]);
        root.addChild(xres[0]);
        opens.lastOpened = (xres[1])?xres[1]:opens.lastOpened;
        opens.openedFolders = opens.openedFolders.concat(xres[2]);
    })
    return [root, opens.lastOpened, opens.openedFolders];
}
exports.unzip = unzip;

/**
 * 
 * @param {FSNode[]} zipped a list of objects of form [<name>, <type>, <content>, <opened>, [...children]]
 * @param {String} path default path of this node
 */
let unziphelper = function(zipped, path="") {
    // [ <root>, <last-opened-file>, [<opened-folder-path>, ...]]
    let returned = [undefined, undefined, []];
    // [<name>, <type>, <content>, <opened>, [...children]]
    let newpath = path + PathSep + zipped[0];
    let out = new FSNode(zipped[0], zipped[1], zipped[2], zipped[3], [], undefined, newpath);
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
        result = unziphelper(child, newpath);
        out.addChild(result[0]);
        if (result[1]) returned[1] = result[1];
        returned[2] = returned[2].concat(result[2]);
    })

    return returned;
}

/**
 * 
 * @param {String} name         : name of the node
 * @param {Type} type           : type of the node, choose from module.Type
 * @param {String} content      : content of the node, ignored if type==folder
 * @param {Boolean} opened      : status: is the node opened?
 * @param {FSNode[]} children   : children of this node, ignored if type==file
 * @param {FSNode} parent       : parent of this node
 * @param {String} PathSep      : path of this node
 */
let FSNode = function(name, type, content="", opened=false, children=[], parent=undefined, path="") {
    this.name=name;
    this.type=type;
    this.content=content;
    this.opened=opened;
    this.children=children;
    this.parent=parent;
    this.path = path;
    this.selected = false;

    this.setOpen = function() { this.opened = true; };
    this.setClose = function() { this.opened = false; };
    this.getName = function() { return this.name + "-" + this.type; };
    this.getCanonicalName = function() { return this.name; };

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
     * @param {String} childName name of the child file
     * @returns boolean if the file name exist
     */
    this.hasChildFile = function(childName) { return this.has(childName + "-" + Type.file); }

    /**
     * 
     * @param {String} childName name of the child folder
     * @returns boolean if the folder name exist
     */
    this.hasChildFolder = function(childName) { return this.has(childName + "-" + Type.folder); }

    /**
     * 
     * @param {String} fullname name of the child node
     * @returns boolean: if the child node name exist
     */
    this.has = function(fullname) {
        if (debug) {
            let fresult = this.children.filter(x => x.getName() == fullname);
            log(`found ${fresult.length} results for ${fullname} under node ${this.path}`);
            if (fresult.length > 1) {
                throw new FSNodeError(`Duplicate child file ${fullname} found at folder ${this.path}`);
            } else {
                return fresult == 1;
            }
        } else {
            return this.children.filter(x => x.getName() == fullname).length == 1;
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
            this.path = cursor.getCanonicalName() + "/" + this.path;
            cursor = cursor.parent;
        }
        return this.path;
    }

    /**
     * passively updates self's path based on provided new path
     * @param {String} newpath new path that needs to be updated
     */
    this.passiveUpdateSelfPath = function(newpath) {
        this.path = newpath + PathSep + this.getCanonicalName();
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

    this.toggleOpen = function() {
        this.opened = !this.opened;
    }
}
exports.FSNode = FSNode;

exports.createFile = function(name, opened=false, content="") {
    return new FSNode(name, Type.file, content, opened);
}

exports.createFolder = function(name, opened=false, content="") {
    return new FSNode(name, Type.folder, content, opened);
}