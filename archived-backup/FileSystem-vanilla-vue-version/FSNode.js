/**
 * Node type enum: either File or Folder, referred as module.Type
 */
let Type = {
    file: "file",
    folder: "folder",
}
exports.Type = Type;

/**
 * 
 * @param {FSNode} unzipped unzipped general FSNode
 */
let zip = function(unzipped) {
    let zipped = ziphelper(unzipped);
    return JSON.stringify(zipped);
}
exports.zip = zip;

/**
 * 
 * @param {FSNode} unzipped unzipped general FSNode
 */
let ziphelper = function(unzipped) {
    let out = [unzipped.name, unzipped.type, unzipped.content, unzipped.opened, []];
    let children = out[out.length-1];
    let child;
    for (child in unzipped.children) {
        children.push(ziphelper(unzipped.children[child]));
    }
    return out;
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
        throw "parsing error from node storage: " + err;
    }

    return unziphelper(nodes);
}
exports.unzip = unzip;

/**
 * 
 * @param {Object[]} zipped a list of objects of form [<name>, <type>, <content>, <opened>, [...children]]
 */
let unziphelper = function(zipped) {
    // [ <root>, <last-opened-file>]
    let returned = [undefined, undefined];
    // [<name>, <type>, <content>, <opened>, [...children]]
    let out = new FSNode(zipped[0], zipped[1], zipped[2], zipped[3], {}, undefined);
    returned[0] = out;

    if (out.type == Type.file && out.opened) {
        returned[1] = out;
    }

    let result;
    zipped[4].forEach( (child) => {
        result = unziphelper(child);
        out.addChild(result[0]);
        if (result[1]) returned[1] = result[1];
    })

    return returned;
}

/**
 * 
 * @param {String} name         : name of the node
 * @param {exports.Type} type   : type of the node, choose from module.Type
 * @param {String} content      : content of the node, ignored if type==folder
 * @param {Boolean} opened      : status: is the node opened?
 * @param {Object} children     : children of this node, ignored if type==file
 * @param {Object} parent       : parent of this node
 */
let FSNode = function(name, type, content="", opened=false, children={}, parent=undefined) {
    this.name=name;
    this.type=type;
    this.content=content;
    this.opened=opened;
    this.children=children;
    this.parent=parent;
    this.selected = false;

    this.setOpen = function() { this.opened = true; };
    this.setClose = function() { this.opened = false; };
    this.getName = function() { return this.name + "-" + this.type; };
    this.getCanonicalName = function() { return this.name; };

    this.isFile = function() { return this.type == Type.file; } 
    this.isFolder = function() { return this.type == Type.folder; }

    this.addChild = function(child) {
        Vue.set(this.children, child.getName(), child);
        child.parent = this;
    }

    this.deleteChild = function(child) {
        child.parent = undefined;
        Vue.delete(this.children, child.getName());
    }

    this.hasChildFile = function(childName) {
        return this.children[childName+"-"+Type.file] != undefined;
    }

    this.hasChildFolder = function(childName) {
        return this.children[childName+"-"+Type.folder] != undefined;
    }

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

    this.findPath = function() {
        let cursor = this.parent;
        let out = this.getCanonicalName();
        while (cursor.parent != undefined) {
            out = cursor.getCanonicalName() + "/" + out;
            cursor = cursor.parent;
        }
        return out;
    }

    this.summarize = function() {
        // [<summarized-object>, [<opened-id>, ...]]
        let out = [{
            name: this.getCanonicalName(),
            id: this.findPath(),
            isFile: this.isFile(),
        }, []];
        let summarized = out[0];
        let openedItem = out[1];

        if (this.opened) openedItem.push(summarized.id);

        if (this.isFolder()) {
            summarized.children = [];
            let child, result;
            for (child in this.children) {
                result = this.children[child].summarize();
                summarized.children.push(result[0]);
                openedItem = openedItem.concat(result[1]);
            }
        }
        return out;
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

Vue.component("fsnode", {
    props: ["node"],

    computed: { },

    methods: {
        resolveClick: function() {
            this.node.toggleOpen();
            this.$emit("click-handler", this.node);
        },

        pass: function(e) {
            this.$emit("click-handler", e);
        },
    },

    template: `
    <div class="note" :class="'fs-'+node.type">
        <div @click.stop="resolveClick" class="note title" :class="{selected: node.selected, opened: node.opened}">
            <template v-if="node.isFile()">
                <v-icon v-if="node.opened">mdi-file-edit-outline</v-icon>
                <v-icon v-else>mdi-file-outline</v-icon>
            </template>
            <template v-else>
                <v-icon v-if="node.opened">mdi-folder-open-outline</v-icon>
                <v-icon v-else>mdi-folder-outline</v-icon>
            </template>
            {{ node.name }}
            <hr/>
            {{ node.content.substr(0, 100) }}
        </div>
        <div v-if="node.opened && node.isFolder()" class="note children">
            <fsnode v-for="child in node.children" :node="child" :key="child.getName()" @click-handler="pass"></fsnode>
        </div>
    </div>
    `,
})