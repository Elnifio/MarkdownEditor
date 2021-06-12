let placeholder = "this is a placeholder value - folders.js line 1";
let rootInitDescription = placeholder;

let buildNode = function(inp) {
    let openedFile = undefined;
    let buildNodeRecursive = function(nodeString) {
        // node-representation: [<name>, <content>, <isDictionary>, <isOpened>, <children-node-representation>]
        // children-node-representation: node-representation
        // name: string
        // content: string
        // isDictionary: boolean
        // isOpened: boolean
    
        let node;
        try {
            node = JSON.parse(nodeString);
        } catch (err) {
            throw "parsing error from node storage: " + err;
        }

        //  node[0] :   name
        //  node[1] :   content
        //  node[2] :   isDictionary
        //  node[3] :   isOpened
        //  node[4] :   children list
        let out = new Node(node[0], node[1], {isDictionary: node[2], isOpened: node[3]}, {}, undefined);

        // if current node is not a folder and is opened: current cursor point to this file
        if (node[3] && !node[2]) {
            out.setClose();
            openedFile = out;
        }

        let childNode;
        node[4].map( (x) => {
            childNode = buildNodeRecursive(x);
            out.addChild(childNode);
        } );
    
        return out;
    }

    let result =  buildNodeRecursive(inp);
    return {opened: openedFile, result};
}

let compressNode = function(node) {
    // node-representation: [<name>, <content>, <isDictionary>, <isOpened>, <children-node-representation>]
    // children-node-representation: node-representation
    // name: string
    // content: string
    // isDictionary: boolean
    // isOpened: boolean
    let out = [node.name, node.content, node.status.isDictionary, node.status.isOpened];
    let children = [];
    let x;
    for (x in node.children) {
        children.push(compressNode(node.children[x]));
    }
    out.push(children);
    return JSON.stringify(out);
}

let folders = function(storageString) {
    // initialization: root node, its children should be the dictionary loaded from JSON
    let buildResult = buildNode(storageString);
    this.root = buildResult.result;
    this.root.setOpen();

    // cursor for navigating between nodes (navigate down)
    this.filecursor = buildResult.opened;

    // check if current file cursor is none
    this.hasFileCursor = function() {
        return this.filecursor != undefined && this.filecursor != null;
    }

    // cursor for navigating between folders
    this.foldercursor = (this.hasFileCursor())?(this.root):(this.filecursor.parent);
    
    if (this.hasFileCursor()) {
        this.filecursor.setOpen();
    }

    // resets cursor position
    this.resetFileCursor = function(node) { 
        this.filecursor = node;
        this.foldercursor = this.getWorkingFolder();
    }

    this.resetFolderCursor = function(node) {
        this.foldercursor = node;
    }

    this.getCurrentContent = function() {
        if (this.hasFileCursor()) {
            return this.filecursor.getContent();
        }
        else {
            return rootInitDescription;
        }
    }

    // gets the current editing-file's folder
    this.getWorkingFolder = function() {
        if (this.filecursor == undefined) {
            return this.foldercursor;
        } else {
            if (this.filecursor.parent.isFile()) {
                throw "unexpected file nested within file.";
            } else 
            if (this.filecursor.parent == undefined || this.filecursor.parent == null) {
                throw "null parent exception";
            } else 
            {
                return this.filecursor.parent;
            }
        }

        /*
         * unused previous version
         * if (this.filecursor.isDictionary) { return this.cursor; } else { if (this.cursor.parent.isFile) { throw "unexpected file nested within file."; } else if (this.cursor.parent == undefined || this.cursor.parent == null) {throw "null parent exception"; } else { return this.cursor.parent; }}
         */
        
    }

    this.getSelectedFolder = function() {
        if (this.foldercursor == undefined || this.foldercursor == null) {
            throw "unexpected null-pointer";
        }
        return this.foldercursor;
    }

    this.saveCurrentFile = function(content) {
        if (this.filecursor == undefined) {
            throw "no cursor opened";
        } 
        else {
            this.filecursor.setContent(content);
        }
        return this.filecursor;
    }

    /**
     *      add new file:   create a new file node under current cursor:
     *                          if current cursor is a folder: append this file node under current cursor
     *                          else: is a file, must have a parent, append this file node under current cursor's parent
     *                      and resets the cursor to the newly-created node
     *      1. should first save the content on the editor to cursor, 
     *      2. call this method
     *      3. load current cursor's content to the editor, 
     *      4. render the folder view correspondingly
     */
    this.createFile = function() {
        try {
            let parent = this.getWorkingFolder();
            let name = "undefined";
            // if parent do have name "undefined":
            console.log(parent.children);
            console.log(parent.hasChildFile(name));
            console.log(name + fileSuffix);
            if (parent.hasChildFile(name)) {
                // try append 1 to the end of the name
                // and check every time
                let counter = 1;
                while (parent.hasChildFile(name + counter)) {
                    counter += 1;
                }
                name = name + counter;
            }

            let node = new Node(name, placeholder, {isDictionary: false, isOpened: true}, {}, parent);
            this.filecursor = node;
            parent.addChild(node);
            return;
            

            // let node;
            // // if parent do not have name "undefined":
            // if (!parent.hasChildFile(name)) {
            //     node = new Node(name, "", {isDictionary: false, isOpened: true}, {}, parent);
            //     this.filecursor = node;
            //     return;
            // }
            // // else: try append '1' to file end, and check 
            // else {
            //     let counter = 1;
            //     while (parent.hasChildFile(name + counter)) {
            //         counter += 1;
            //     }
            //     node = new Node(name + counter, "", {isDictionary: false, isOpened: true}, {}, parent);
            //     this.filecursor = node;
            //     return;
            // }
        }
        catch (err) {
            throw "error occured when creating a new file: " + err;
        }
    }

    // TODO: -------- createFolder function --------
    //  add a new folder:   create a new folder node under current selected folder:
    //                      append this newly-created folder to current folder
    //                      but do not navigate to newly-created folder
    this.createFolder = function() {
        
    }

    this.registerListener = function(listener) {
        this.root.registerListener(listener);
    }

    this.getRender = function() {
        return this.root.getView();
    }
}

let fileSuffix = "-FILE";
let folderSuffix = "-FOLDER";

let Node = function(name="untitled", content="", status={isDictionary:false, isOpened: false}, children = {}, parent=undefined) {
    // name of this node
    this.name = name;

    // content of this node: 
    //  content of a note file; 
    //  optional description of a folder
    this.content = content;
    
    // children dictionary
    //   <full-name : Node reference>
    this.children = children;

    // status of this file: 
    //  isDirectory :   true if this node represents a directory, 
    //                  false if represents a file
    //  isOpened    :   true if this node is opened: 
    //                      file:   load it to the editor if opened
    //                      folder: render it as a "open folder" - i.e., render its successive childrens
    this.status = status;

    // parent cursor, helps navigate through the tree
    this.parent = parent;

    // node view object, give pointer to all node view contents
    this.view = {
        container: undefined,
        nameContainer: undefined,
        icon: undefined,
        name: undefined,
        contentContainer: undefined,
        childrenContainer: undefined
    }

    // listener
    this.listener = undefined;

    // Determines if this node is a dictionary or a file
    this.isDirectory = function() { return this.status.isDictionary; }
    this.isFile = function() { return !this.status.isDictionary; }

    // toggle the open status of a file
    this.setOpen = function() { 
        this.status.isOpened = true;
        this.renderOpen();
    }
    this.setClose = function() { 
        this.status.isOpened = false;
        this.renderOpen();
    }

    // useful for the id of rendered element, resolve name collision
    this.getFullName = function() { return this.name + (this.isFile()?fileSuffix:folderSuffix); }

    // builds the node view
    this.buildRender = function() {
        // outer container - contains header, other elements
        // class name: fs-folder if this=folder, fs-file if this=file
        this.view.container = document.createElement('div');
        this.view.container.setAttribute('id', this.getFullName());
        this.view.container.setAttribute('class', 'note fs-' + (this.isDirectory()?'folder':'file') );

        // renders the title of this element
        // if we need to render file and folder with different fonts then we change this
        // class name: fs-name-container
        this.view.nameContainer = document.createElement('h6');
        this.view.nameContainer.setAttribute('class', 'fs-name-container');
        this.view.container.append(this.view.nameContainer);
        
        // renders the icon: either opened file or closed file
        this.view.icon = document.createElement('i');
        this.view.nameContainer.append(this.view.icon);

        this.view.name = document.createElement('span');
        this.view.name.innerHTML = this.name;
        this.view.nameContainer.append(this.view.name);

        this.view.contentContainer = document.createElement('div');
        this.view.container.append(this.view.contentContainer);

        this.view.childrenContainer = document.createElement('div');
        this.view.childrenContainer.setAttribute('class', 'fs-children-container');
        this.view.container.append(this.view.childrenContainer);
        this.renderOpen();
    }

    // renders open & close status change
    this.renderOpen = function() {
        if (this.isOpen()) {
            this.view.icon.setAttribute('class', (this.isDirectory())?'far fa-folder-open':'far fa-file-code');
            this.view.childrenContainer.style.display = "block";
        } else {
            this.view.icon.setAttribute('class', (this.isDirectory())?'far fa-folder':'far fa-file');
            this.view.childrenContainer.style.display = "none";
        }
    }

    // append child method 
    this.addChild = function(child) { 
        // adds the children to model
        this.children[child.getFullName()] = child; 
        child.parent = this;
        // adds the children to view
        this.view.childrenContainer.append(child.view.container);
    }

    // delete child node
    this.deleteChild = function(child) {
        // delete the children from model
        child.parent = undefined;
        delete this.children[child.getFullName()];
        // delete the children from view
        this.view.childrenContainer.removeChild(child.view.container);
    }

    // check if name available for a file
    this.hasChildFile = function(childName) {
        return this.children[childName + fileSuffix] != undefined;
    }

    // check if name available for a folder
    this.hasChildDirectory = function(childName) {
        return this.children[childName + folderSuffix] != undefined;
    }

    // TODO: rename this child 
    this.rename = function(new_name) {
        // TODO:    first check if this node has a parent
        // TODO:        if no parent: is root node, we do not modify it
        // TODO:        else:   we first search in parent childrens to see if there are nodes with the same name
        // TODO:                if not, we rename our current node, and update the key in parent node
        // TODO:                else: raise an error
        return;
    }

    // Get & set for content
    this.getContent = function() { return this.content; }
    this.setContent = function(new_content) { this.content = new_content; }

    // status checker
    this.isOpen = function() {return this.status.isOpened; }

    // open & close setter
    this.toggleOpen = function() {
        if (this.isOpen()) {
            this.setClose();
        } else {
            this.setOpen();
        }
    }

    // registers listener for click
    this.registerListener = function(listener) {
        this.view.nameContainer.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            listener.listenNodeClick(this);
        });
        let child;
        for (child in this.children) {
            this.children[child].registerListener(listener);
        }
    }

    this.getView = function() {
        return this.view.container;
    }

    this.buildRender();
}

let parseFolders = function(inp) {
    return folders(inp);
}

let storeFolders = function(f) {
    return compressNode(f.root);
}

let Folders = {
    "folder":folders,
    "folderParser": parseFolders,
    "SUFFICES": {fileSuffix, folderSuffix},
    "node": Node, 
    'compressNode': compressNode,
    'buildNode': buildNode
};

export default Folders;