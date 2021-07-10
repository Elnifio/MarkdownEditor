const FSNode = require("./archived-backup/FileSystem-Vuetify-TreeView/FSNode");
const FSModule = require("./FileSystem/FSModule");
const FSControlKit = require("./archived-backup/FileSystem-Vuetify-TreeView/FSControlKit");
const EditorModule = require("./Editor/EditorModule");
const Conponents = require("./MarkdownCompiler/Components");
const TODOComponents = require("./TODOSystem/TODOModule");
const fs = require("fs");
const TabManager = require("./Tabs/TabManager");

const { ipcRenderer } = require("electron");

ipcRenderer.on("log-value-result", (event, message) => {
    console.log(message);
})

let storage = fs.readFileSync("storage.json").toString();

/**
 * Debug Usage
 */
if (storage == "") {
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

let tags = ""

if (tags == "") {
    let TM = new TabManager.TabManager();
    TM.createTab('test 01');
    TM.createTab("test 02");
    TM.createTab("test 03");
    tags = TabManager.ZipTabManager(TM);
}

let TM = TabManager.UnzipTabManager(tags);

let FS = FSModule.FSFactory(storage, TM);
FS.collectFiles();
let EMStore = new EditorModule.Editor(TM.tabs);
EMStore.setCurrent(FS.current);
EMStore.setTag(FS.getTags());

Vue.use(Vuetify);

ipcRenderer.on('close-app', (event, message) => {
    // if (FS.hasFileCursor()) FS.current = EMStore.getCurrent();
    fs.writeFileSync('./storage.json', FS.export());
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

        addTag: function(tag) {
            this.storage.addTag(tag);
        },

        deleteTag: function(tag) {
            this.storage.deleteTag(tag);
        },

        bringEditorToFront: function() {
            this.showEditor = true;
            this.showTODO = false;
        }
    }
})

