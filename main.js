const { app, BrowserWindow, ipcMain, shell } = require('electron')
const fs = require("fs");

const AppPath = app.getPath("appData") + "/CodeUp";
if (!fs.existsSync(AppPath)) {
    fs.mkdirSync(AppPath);
}
const storage = AppPath + "/storage.json";

let win = undefined;
let closable = false;
let quittable = false;

let createWindow = function() {

    win = new BrowserWindow({
        width: 800, height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    })
    win.loadFile("./index.html");

    win.webContents.on('new-window', function(e, url) {
        e.preventDefault();
        shell.openExternal(url);
    });

    win.on("close", (e) => {
        console.log("closing");
        console.log(`closable status: ${closable}`);
        if (!closable) {
            e.preventDefault();
            win.webContents.send("close-app", "closing files"); 
        }

        if (quittable) {
            app.quit();
        }
    })
}

app.whenReady().then(createWindow);

ipcMain.on("close-complete-index", (event, arg) => {
    console.log(arg);
    closable = true;
    console.log("closable toggled");
    win.close();
})

ipcMain.on("log-value", (event, arg) => {
    console.log(arg);
    event.reply("log-value-result", "log-value-complete");
})

ipcMain.on("read-storage", (event) => {
    if (!fs.existsSync(storage)) {
        event.returnValue = "";
    } else {
        event.returnValue = fs.readFileSync(storage).toString();
    }
})

ipcMain.on("write-storage", (event, givenStorage) => {
    try {
        fs.writeFileSync(storage, givenStorage);
        event.returnValue = true;
    } catch(e) {
        event.returnValue = false;
    }
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on("before-quit", () => {
    quittable = true;
})

app.on("close-complete", (event, args) => {
    console.log(args);
    closable = true;
    console.log("closable toggled");
    win.close();
})

app.on('activate', () => {
    console.log("activated");
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})