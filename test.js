const FSNode = require("./FileSystem/FSNode");
const FSModule = require("./FileSystem/FSModule");
const FSControlKit = require("./FileSystem/FSControlKit");
const EditorModule = require("./Editor/EditorModule");
const Conponents = require("./MarkdownCompiler/Components");
const fs = require("fs");

let storage = fs.readFileSync("storage.json").toString();
const rootEle = new FSNode.FSNode("root", FSNode.Type.folder, "", true);
if (storage == "") storage = FSNode.zip(rootEle);
let FS = new FSModule.FS(storage);
let EMStore = new EditorModule.Editor();
EMStore.setCurrent(FS.getCurrentContent());

Vue.use(Vuetify);

require('electron').ipcRenderer.on('close', (event) => {
    if (FS.hasFileCursor()) FS.saveCurrentFile(EMStore.getCurrent());
    fs.writeFileSync('./storage.json', FS.export());
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

