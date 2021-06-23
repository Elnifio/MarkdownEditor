const FSNode = require("./FileSystem/FSNode");
const FSModule = require("./FileSystem/FSModule");
const FSControlKit = require("./FileSystem/FSControlKit");
const EditorModule = require("./Editor/EditorModule");
const Conponents = require("./MarkdownCompiler/Components");
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
let EMStore = new EditorModule.Editor();
EMStore.setCurrent(FS.current);

Vue.use(Vuetify);

ipcRenderer.on('close-app', (event, message) => {
    // if (FS.hasFileCursor()) FS.current = EMStore.getCurrent();
    fs.writeFileSync('./storage.json', FS.export());
    ipcRenderer.send("close-complete-index", "closed");
})

let Central = {
    navbar: {
        show: true,
        storage: true,
    },
    editor: {
        editable: FS.hasFileCursor(),
    }
}

let vm = new Vue({
    el: "#app",
    vuetify: new Vuetify(),

    data: {
        // nodes: FSNode.unzip(zipped)[0],
        storage: FS,
        initval: "initialization",
        emstore: EMStore,
        central: Central,
    },

    methods: {
        log: function(e) {
            console.log(e);
        },

        adjustNavbar: function() {
            this.central.showNavbar = !this.central.showNavbar;
        },
        adjustStorage: function() {
            console.log(`showNavbar: ${this.central.navbar.storage}, showStorage: ${this.central.navbar.storage}`);
            this.central.navbar.storage = (!this.central.navbar.show) && (!this.central.navbar.storage);
        },

        showStorage: function() {
            return !(this.central.navbar.show || this.central.navbar.storage);
        },

        switchNote: function(newvalue) {
            console.log("updated new value: "+ newvalue);
            this.emstore.setCurrent(newvalue);
            this.central.editor.editable = true;
        },

        storeToSystem: function() {
            console.log("storing to system");
            this.storage.current = this.emstore.getCurrent();
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
            this.central.editor.editable = true;
        },

        clearEditor: function() {
            this.central.editor.editable = false;
            this.emstore.setCurrent("Did not open any file"); 
            /*
            刚打开app时如果没有打开任何笔记，则显示内容由FS.getCurrentContent()控制，具体值被设置为FSModule.rootInitDescrption变量
            */
        }

    }
})

