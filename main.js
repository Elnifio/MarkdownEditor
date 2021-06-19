const { app, BrowserWindow, ipcMain } = require('electron')

console.log("started");

let win = undefined;
let closable = false;
let quittable = false;

/**
 * Previous version of initiating window:
    function createWindow () {
        win = new BrowserWindow({
            width: 800,
            height: 600,
            minWidth: 800,
            minHeight: 600,
            webPreferences: {
                nodeIntegration: true
            }
        })

        win.loadFile('index.html');
        // win.loadFile("test.html");

        win.webContents.openDevTools()

        // close event emitter
        // win.webContents.on('close', () => {
        //     win.webContents.send("close-app", "closing files");
        // });
        win.on("close", (e) => {
            console.log("closing app");
            win.webContents.send("close-app", "closing files");
        });
    };
    app.whenReady().then(createWindow)
 */

app.whenReady().then(() => {
    win = new BrowserWindow({
        width: 800, height: 600,
        webPreferences: {
            nodeIntegration: true
        }
    })
    win.loadFile("./index.html");
    win.webContents.openDevTools()

    // win.webContents.on("did-finish-load", () => {
    //     win.webContents.send("log-value-result", "starting app");
    // })

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
})

app.addRecentDocument("./recent")

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
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})