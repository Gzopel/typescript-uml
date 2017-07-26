import * as electron from "electron";
// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

import * as path from "path";
import * as url from "url";

const [, , extensionPath, fileName] = process.argv;
// tslint:disable-next-line:no-console
console.log("args", process.argv);
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow: Electron.BrowserWindow;
// tslint:disable-next-line:no-debugger
debugger;
function createWindow() {
    global["diagramArgs"] = process.argv;
    // Create the browser window.
    mainWindow = new BrowserWindow({
        title: `${path.basename(fileName)} Diagram`,
        show: false,
    });
    // and load the index.html of the app.
    mainWindow.loadURL(url.format({
        pathname: path.join(extensionPath, "html", "diagram.html"),
        protocol: "file:",
        slashes: true,
    }));
    mainWindow.maximize();
    mainWindow.show();
    // Open the DevTools.
    // mainWindow.webContents.openDevTools()

    // Emitted when the window is closed.
    mainWindow.on("closed", () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.