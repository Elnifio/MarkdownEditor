const FSNode = require("./FileSystem/FSNode");
const FSModule = require("./FileSystem/FSModule");
const FSControlKit = require("./FileSystem/FSControlKit");
const EditorModule = require("./Editor/EditorModule");
const Conponents = require("./MarkdownCompiler/Components");
const TODOComponents = require("./TODOSystem/TODOModule");
const fs = require("fs");

const { ipcRenderer } = require("electron");

ipcRenderer.on("log-value-result", (event, message) => {
    console.log(message);
})

let storage = fs.readFileSync("storage.json").toString();

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
let FS = FSModule.FSFactory(storage);
FS.collectFiles();
let EMStore = new EditorModule.Editor();
EMStore.setCurrent(FS.current);

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

        showNavbar: true,
        showStorage: true,

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
            this.showNavbar = !this.showNavbar;
        },
        adjustStorage: function() {
            console.log(`showNavbar: ${this.showNavbar}, showStorage: ${this.showStorage}`);
            this.showStorage = (!this.showNavbar) && (!this.showStorage);
        },

        adjustTODO: function() {
            this.showTODO = true;
            this.showEditor = false;
        },

        showFile: function() {
            return !(this.showNavbar || this.showStorage);
        },

        switchNote: function(newvalue) {
            console.log("updated new value: "+ newvalue);
            this.emstore.setCurrent(newvalue);
            this.editable = true;
            this.showTODO = false;
            this.showEditor = true;
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
        }

    }
})

