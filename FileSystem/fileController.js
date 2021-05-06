/**
 * 
 * @param {*} folderTree 
 * @param {*} renderer 
 * 
 * Interface: 
 *  query:
 *      listenFolderClick(node)     ->  listens the event that a folder UI has been clicked
 *                                      if renderer detects that a folder has been clicked, 
 *                                      this method is invoked, update current folderTree
 *                                          selected folder toggle open/close status
 *                                          in renderer: update style associated with the particular folder
 *      listenFileClick(node)       ->  listens if a file has been clicked
 *                                      if renderer detects that a file has been clicked, 
 *                                      this method is invoked, update current folderTree:
 *                                          save editor content to currently opened file
 *                                          close currently opened file 
 *                                          open selected file
 *                                          update editor with current file context
 *                                          update renderer with style
 *  create:
 *      listenNewFolder(node)       ->  listens if "new folder" button has been clicked
 *      listenNewFile(node)         ->  listens if "new file" button has been clicked
 *  delete: 
 *      listenDeleteFile(node)      ->  listens if currently opened file should be deleted
 *      listenDeleteFolder(node)    ->  listens if current folder should be deleted
 *  update: 
 *      listenRelocateFile(node)    ->  listen if current file should be relocated
 *      listenRelocateFolder(node)  ->  listen if current folder should be relocated
 */

import Renderer from './fileRenderer.js';
import Folders from './folders.js';
const fs = require('fs');

let readNotes = function(path="./FileSystem/notes.json") {
    return fs.readFileSync(path, {encoding: 'utf8'});
}

let fileController = function() {
    let storage = readNotes();

    this.renderer = new Renderer();
    this.model = new Folders.folder(storage);
    this.model.registerListener(this);

    this.listener = undefined;
    this.listenAvaibale = function() { return this.listener != undefined && this.listener != null; };
    this.registerListener = function(listener) { this.listener = listener; }

    this.renderer.registerListener(this);

    /**
     *  on opening a folder: 
     *  do not need general controller to know
     *  just need renderer to render corresponding components
     *  notify folder to update node status
     * @param {*} node 
     */
    this.listenFolderClick = function(node) {
        node.toggleOpen();
        this.model.resetFolderCursor(node);
    }

    /**
     *  on opening a file: 
     *  need general controller to know and give the current editor value back
     * @param {*} node 
     */
    this.listenFileClick = function(newNode) {
        if (this.listenAvaibale()) {
            let out = (currentValue) => { 
                // save current value to currently-editing node
                // close current node in folder
                // set newnode to be in open status
                // set folder's file cursor to be newnode
                // returns model's current content
                let currentNode = this.model.saveCurrentFile(currentValue);
                currentNode.setClose();
                this.model.resetFileCursor(newNode);
                newNode.setOpen();
                console.log(newNode);
                return this.model.getCurrentContent();
            };

            this.listener.updateContent(out);
        }
    }

    this.listenNodeClick = function(node) {
        if (node.isDirectory()) {
            this.listenFolderClick(node);
        } else {
            this.listenFileClick(node);
        }
    }

    this.render = function() {
        return (container) => {
            container.append(this.model.getRender());
        };
    }

    this.queryContent = function() {
        return this.model.getCurrentContent();
    }

    /**
     * Handles create-file event
     */
    this.createFile = function() {
        /**
         * pass in current editor's value
         * save current file
         * set current file to close
         * call model's createFile method
         * gets current content as return value
         * set current cursor to open status
         * @param {*} currentValue 
         */
        let out = (currentValue) => {
            let current = this.model.saveCurrentFile(currentValue);
            current.setClose();
            this.model.createFile();
            this.model.filecursor.setOpen();
            return this.model.getCurrentContent();
        }
        return out;
    }
}




let FileController = {
    controller: fileController
};

export default FileController;