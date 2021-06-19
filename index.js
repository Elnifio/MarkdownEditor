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

let vm = new Vue({
    el: "#app",
    vuetify: new Vuetify(),

    data: {
        // nodes: FSNode.unzip(zipped)[0],
        storage: FS,
        initval: "initialization",
        emstore: EMStore,
    },

    methods: {
        log: function(e) {
            console.log(e);
        },

        switchNote: function(newvalue) {
            console.log("updated new value: "+ newvalue);
            this.emstore.setCurrent(newvalue);
        },

        storeToSystem: function() {
            console.log("storing to system");
            this.storage.current = this.emstore.getCurrent();
            ipcRenderer.send("log-value", "storing to system");
        },


    }
})

