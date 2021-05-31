import Folder from '../FileSystem/folders.js';
import FileController from '../FileSystem/fileController.js';
import Renderer from '../FileSystem/fileRenderer.js';

let visualize = function(node) {
    let out = {
        name: node.name,
        content: node.content,
        isOpened: node.status.isOpened,
        isDictionary: node.status.isDictionary, 
        children: {}
    };

    let children;
    for (children in node.children) {
        out.children[children] = visualize(node.children[children]);
    }

    return out;
}

let compress = Folder.compressNode;
let Node = Folder.node;

let root = new Node("root", '', {isDictionary: true, isOpened: false}, {}, undefined);
let folder1 = new Node("folder1", "", {isDictionary: true, isOpened: true}, {}, undefined);
let folder2 = new Node("folder2", "", {isDictionary: true, isOpened: true}, {}, undefined);
let folder3 = new Node("folder3", "", {isDictionary: true, isOpened: true}, {}, undefined);
let file1 = new Node("file1", "content of file 1", {isDictionary: false, isOpened: true}, {}, undefined);
let file2 = new Node("file2", "content of file 2", {isDictionary: false, isOpened: true}, {}, undefined);
let file3 = new Node("file3", "content of file 3", {isDictionary: false, isOpened: true}, {}, undefined);

root.addChild(folder1);
root.addChild(folder2);
folder1.addChild(folder3);
folder2.addChild(file1);
folder1.addChild(file2);
folder3.addChild(file3);

console.log(compress(root));

const fs = require('fs');
fs.writeFileSync('./FileSystem/notes.json', compress(root));

// let controller = new FileController.controller();
// console.log(controller.render());

// document.getElementById('fileContainer').append(controller.render());

// console.log(JSON.stringify(visualize(folder.root)));
// console.log(visualize(folder.root));
// console.log('--------')
// console.log(folder.getWorkingFolder())


