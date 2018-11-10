const path = require("path");
const { app, BrowserWindow, ipcMain } = require("electron");
const ipc = require("node-ipc");

ipc.config.id = "child";
ipc.config.retry = 2000;
ipc.config.silent = true;
ipc.config.sync = true;

ipc.connectTo("server", () => {
  ipc.of.server.on("connect", () => {
    app.dock.hide();

    app.on("ready", () => {
      const win = new BrowserWindow({
        show: false,
        webPreferences: {
          webgl: true,
          offscreen: true
        }
      });

      win.loadURL("file://" + path.join(__dirname, "index.html"));

      ipcMain.on("mesh", (_, mesh) => {
        ipc.of.server.emit("mesh", mesh);
      });

      ipc.of.server.on("close", () => {
        ipc.disconnect("server");
        app.exit();
      });

      win.webContents.on("did-finish-load", () => {
        ipc.of.server.emit("did-finish-load");
      });

      ipc.of.server.on("shader", data => {
        win.webContents.send("shader", data);
      });
    });
  });
});
