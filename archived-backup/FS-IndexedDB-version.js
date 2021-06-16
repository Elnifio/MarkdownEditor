import Vue from "vue";

let debug = true;
let log = function(msg) {
    if (debug) console.log(msg);
}

let FSError = function(msg="")  {
    this.name = "File System Error"
    this.msg = msg;
    this.toString = () => this.name + ": " + this.msg;
}

let emit = function(listeners, event, args=undefined) {
    listeners.forEach(x => x.receive(event, args));
}

let DBStatus = {
    Initiated: "DB-initiated",
    Loading: "DB-loading",
    Failed: "DB-failed",
    Ready: "DB-ready",
}

let defaultDBNames = {
    db: "storage",
    files: "file",
    folders: "folder",
}

let FSLoader = function(listeners=[], db=defaultDBNames.db, files=defaultDBNames.files, folders=defaultDBNames.folders) {
    let dbreq = window.indexedDB.open(db);

    dbreq.onerror = event => { 
        log("error when connecting to a database");
        emit(DBStatus.Failed); 
    }

    dbreq.onsuccess = event => {
        log("successfully connects to storage database");
        emit(Status.Ready, dbreq.result);
    }

    dbreq.onupgradeneeded = event => {
        let dbresult = event.target.result;
        log("upgraded folder database");
        
        if (!dbresult.objectStoreNames.contains(files)) {
            dbresult.createObjectStore(files, { keyPath: "fullpath" });
            log("created new files database");
        }

        if (!dbresult.objectStoreNames.contains(folders)) {
            dbresult.createObjectStore(folders, { keyPath: "fullpath" });
            log("created new folders database");
        }

        emit(Status.Ready, dbresult);
    }
}

let FSCollector = function(listeners=[]) {
    
}
