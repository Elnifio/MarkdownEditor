const FSNode = require("./archived-backup/FileSystem-Vuetify-TreeView/FSNode");
const FSModule = require("./FileSystem/FSModule");
const FSControlKit = require("./archived-backup/FileSystem-Vuetify-TreeView/FSControlKit");
const EditorModule = require("./Editor/EditorModule");
const Conponents = require("./MarkdownCompiler/Components");
const TODOComponents = require("./TODOSystem/TODOModule");
const fs = require("fs");
const TabManager = require("./Tabs/TabManager");
const IconPicker = require("./utils/IconPicker");

const { ipcRenderer } = require("electron");

ipcRenderer.on("log-value-result", (event, message) => {
    console.log(message);
})

let storage = fs.readFileSync("storage.json").toString().split("\n");
let filestorage = storage[0];
let tagstorage = storage[1];

/**
 * Debug Usage
 */
if (filestorage == "") {
    console.log("re-creating root elements");
    const rootEle = new FSNode.FSNode("root", FSNode.Type.folder, "", true);
    let n01 = FSNode.createFile("n01", true, "n01 content");
    let n02 = FSNode.createFolder("n02", true);
    let n03 = FSNode.createFile("n03", false, "n03 content");
    let n04 = FSNode.createFile("n04", false, "n04 content");
    n02.addChild(n03);
    n02.addChild(n04);
    rootEle.addChild(n01);
    rootEle.addChild(n02);
    storage = FSNode.zip(rootEle.children);
}

/**
 * Debug Usage
 */
if (tagstorage == "") {
    console.log("re-creating tags");
    let TM = new TabManager.TabManager();
    TM.createTab('test 01');
    TM.createTab("test 02");
    TM.createTab("test 03");
    TM.createTab("test 04");
    TM.createTab("test 05");
    tagstorage = TabManager.ZipTabManager(TM);
}

let TM = TabManager.UnzipTabManager(tagstorage);

let FS = FSModule.FSFactory(filestorage, TM);
FS.collectFiles();
let EMStore = new EditorModule.Editor(TM.tabs);
EMStore.setCurrent(FS.current);
EMStore.setTag(FS.getTags());

Vue.use(Vuetify);

ipcRenderer.on('close-app', (event, message) => {
    // if (FS.hasFileCursor()) FS.current = EMStore.getCurrent();
    fs.writeFileSync('./storage.json', FS.export() + "\n" + TabManager.ZipTabManager(TM));
    ipcRenderer.send("close-complete-index", "closed");
})

let vm = new Vue({
    el: "#app",
    vuetify: new Vuetify(),

    data: {
        // nodes: FSNode.unzip(zipped)[0],
        storage: FS,
        initval: "initialization",
        emstore: EMStore,
        tabManager: TM,

        hideNavbar: true,
        hideStorage: true,
        hideTags: false,

        editable: FS.hasFileCursor(),
        showEditor: true,
        
        showTODO: false,

        showCreateTag: false,
        defaultTagName: "New Tag",
        defaultTagColor: "#62C6F2FF",
        defaultTagIcon: "mdi-tag",
        clicked: true,
    },

    methods: {
        collectTODOS: function() {
            return FS.collectFiles().filter(x => x.todos.length != 0);
        },

        log: function(e) {
            console.log(e);
        },

        adjustNavbar: function() {
            this.hideNavbar = !this.hideNavbar;
        },

        adjustStorage: function() {
            this.hideStorage = (!this.hideNavbar) && (!this.hideStorage);
            this.hideTags = true;
        },

        adjustTag: function() {
            this.hideTags = (!this.hideNavbar) && (!this.hideTags);
            this.hideStorage = true;
        },

        adjustTODO: function() {
            this.showTODO = true;
            this.showEditor = false;
        },

        showFile: function() {
            return !(this.hideNavbar || this.hideStorage);
        },

        showTag: function() {
            return !(this.hideNavbar || this.hideTags);
        },

        switchNote: function(newvalue) {
            // console.log("updated new value: "+ newvalue);
            console.log("updated to document: " + this.storage.filecursor.getCanonicalName());
            this.emstore.setCurrent(newvalue);
            this.emstore.setTag(this.storage.getTags());
            console.log(this.emstore.tags());
            this.editable = true;
            this.showTODO = false;
            this.showEditor = true;
        },

        updateCurrentEditor: function() {
            console.log(FS.current);
            this.emstore.setCurrent(FS.current);
            this.emstore.setTag(this.storage.getTags());
        },

        storeToSystem: function(newTODOList) {
            console.log("storing to system");
            this.storage.current = this.emstore.getCurrent();
            this.storage.updateFileTODO(newTODOList);
            ipcRenderer.send("log-value", "storing to system");
        },

        createFolder: function() {
            console.log("create a new folder");
            this.storage.createFolder();
        },

        createFile: function() {
            console.log("create a new file");
            this.storage.createFile(this.emstore.getCurrent());
            this.emstore.setCurrent(this.storage.current);
            this.editable = true;
            this.showEditor = true;
            this.showTODO = false;
        },

        clearEditor: function() {
            this.editable = false;
            this.showEditor = false;
            this.emstore.setCurrent("Did not open any file"); 
            /*
                刚打开app时如果没有打开任何笔记，则显示内容由FS.getCurrentContent()控制，具体值被设置为FSModule.rootInitDescrption变量
            */
        },

        /**
         * 点击新建tag按钮时触发
         */
        createTag: function() {
            this.showCreateTag = false;
            this.tabManager.createTab(this.defaultTagName, this.defaultTagColor, this.defaultTagIcon);
        },

        /**
         * 
         * @param {TabInstance} tag 
         * 由向笔记中添加tag时触发，将笔记归类到特定tag下
         */
        addTag: function(tag) {
            this.storage.addTag(tag);
        },

        deleteTag: function(tag) {
            this.storage.deleteTag(tag);
        },

        bringEditorToFront: function() {
            this.showEditor = true;
            this.showTODO = false;
        },

        tagFileRelocationHandler: function(node, newpath) {
            if (node.isFile()) {
                this.storage.relocateFile(node, newpath);
            } else {
                this.storage.relocateFolder(node, newpath);
            }
        },

        tagFileDeletionHandler: function(node) {
            this.storage.deleteGivenNode(node);
            if (!this.storage.filecursor) this.clearEditor();
        },

        tagFileClickHandler: function(clicked) {
            if (clicked.isFolder()) {
                clicked.toggleOpen();
                this.storage.resetFolderCursor(clicked);
            } else {
                if (!clicked.opened) {
                    this.storage.setFileCursorStatus(false);
                    this.storage.resetFileCursor(clicked);
                    this.storage.setFileCursorStatus(true);
                    this.switchNote(this.storage.current);
                }
            }
            if (this.storage.filecursor) {
                this.bringEditorToFront();
            }
        }
    }
})

