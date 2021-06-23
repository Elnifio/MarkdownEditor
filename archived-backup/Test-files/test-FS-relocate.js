const FSNode = require("./archived-backup/FileSystem-VTreeView-version/FSNode");
const FSModule = require("./archived-backup/FileSystem-VTreeView-version/FSModule");

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

let FS = new FSModule.FS(rootEle, n01, []);
FSModule.visualize(FS, "Init");

FS.relocateFile(n06, "/n02/n06");
FSModule.visualize(FS, "relocating n06");

FS.relocateFolder(n02, "/node-new");
FSModule.visualize(FS, "renaming n02");

FS.relocateFolder(n05, "/n02");
FSModule.visualize(FS, "relocating n05");

FS.relocateFolder(n02, "/n02");
FSModule.visualize(FS, "relocating n02");