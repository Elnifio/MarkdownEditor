const FSNode = require("./FileSystem/FSNode");
const FSModule = require("./FileSystem/FSModule");
const FSControlKit = require("./FileSystem/FSControlKit");
const EditorModule = require("./Editor-new/EditorModule");
const node = FSNode.FSNode;
const ftype = FSNode.Type;

let n01 = new node("n01", ftype.file, "123", true);
let n02 = new node("n02", ftype.file, "133");
let n03 = new node("n03", ftype.folder, "", true);
n03.addChild(n02);
n03.addChild(n01);

let n04 = new node("n04", ftype.file, "444", false);
let n05 = new node("n05", ftype.folder, "144", true);
n05.addChild(n03);
n05.addChild(n04);

let zipped = FSNode.zip(n05);
// console.log(zipped);

let FS = new FSModule.FS(zipped);
console.log("--------\nFile cursor:")
console.log(FSNode.zip(FS.filecursor));
console.log("--------\nFolder cursor:")
console.log(FSNode.zip(FS.foldercursor));

let vm = new Vue({
    el: "#zipper",
    data: {
        // nodes: FSNode.unzip(zipped)[0],
        storage: FS,
        initval: "initialization",
    },
    methods: {
        logger: function(e) {
            console.log(FSNode.zip(e));
            console.log(FS.getCurrentContent());
        },
        log: function(updator) {
            console.log(updator("test save"));
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