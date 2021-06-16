const FSNode = require("./FileSystem/FSNode");
const FSModule = require("./FileSystem/FSModule");
const FSControlKit = require("./FileSystem/FSControlKit");
const EditorModule = require("./Editor/EditorModule");
const Conponents = require("./MarkdownCompiler/Components");
const fs = require("fs");

const ipcRenderer = require("electron").ipcRenderer;

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
    storage = FSNode.zip(rootEle);
}
let FS = new FSModule.FS(storage);
let EMStore = new EditorModule.Editor();
EMStore.setCurrent(FS.getCurrentContent());

Vue.use(Vuetify);

ipcRenderer.on('close', (event) => {
    if (FS.hasFileCursor()) FS.saveCurrentFile(EMStore.getCurrent());
    fs.writeFileSync('./storage.json', FS.export());
    ipcRenderer.send("close-complete", FS.export());
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
        logger: function(e) {
            console.log(FSNode.zip(e));
            console.log(FS.getCurrentContent());
        },
        log: function(updator) {
            EMStore.setCurrent(updator(EMStore.getCurrent()));
            // console.log(updator("test save"));
        },
        editormodule: function(event) {
            console.log(event);
        },

        createFile: function() {
            FS.createFile("123");
        },

        createFolder: function() {
            FS.createFolder();
        },

        deleteFile: function() {
            FS.deleteFile();
        },

        deleteFolder: function() {
            FS.deleteFolder();
        }
    }
})

