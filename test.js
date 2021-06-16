const FSNode = require("./FileSystem-VTreeView-version/FSNode");
const FSModule = require("./FileSystem-VTreeView-version/FSModule");
const fs = require("fs");
const EM = require("./Editor/EditorModule");

let storage = fs.readFileSync("storage.json").toString();

if (storage == "") {
    console.log("re-creating root elements");
    const rootEle = new FSNode.FSNode("root", FSNode.Type.folder, "", true);
    let n01 = FSNode.createFile("n01", true, "n01 content");
    let n02 = FSNode.createFolder("n02", true);
    let n03 = FSNode.createFile("n03", false, "n03 content");
    let n04 = FSNode.createFile("n04", false, "n04 content");
    let n05 = FSNode.createFolder("n05", true);
    let n06 = FSNode.createFile("n06", false, "n06 content");
    n05.addChild(n06);
    n02.addChild(n03);
    n02.addChild(n04);
    n02.addChild(n05);
    rootEle.addChild(n01);
    rootEle.addChild(n02);
    storage = FSNode.zip(rootEle.children);
}
console.log(storage);
let FS = FSModule.FSFactory(storage);
console.log(FS.current);

Vue.use(Vuetify);

let vm = new Vue({
    el: "#app",
    vuetify: new Vuetify(),
    data: {
        // nodes: FSNode.unzip(zipped)[0],
        storage: FS,
        initval: "initialization",
    },
    methods: {
        updator: function(updatorFn) {
            console.log(updatorFn("13333"));
        },

        logger: function(e) {
            console.log(FSNode.zip(e));
            console.log(FS.getCurrentContent());
        },
        log: function(updator) {
            EMStore.setCurrent(updator(EMStore.getCurrent()));
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

