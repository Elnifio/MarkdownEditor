const { app, BrowserWindow, ipcMain } = require('electron')

console.log("started");

function createWindow () {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: true
        }
    })

    // win.loadFile('index.html');
    win.loadFile("test.html");

    win.webContents.openDevTools()

    // close event emitter
    win.webContents.on('close', () => {
        win.webContents.send('close');
    });
}

app.whenReady().then(createWindow)

app.addRecentDocument("./recent")

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

ipcMain.on("close-complete", (args) => {
    console.log(args);
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})