const path = require("path");
const { spawn } = require("child_process");
const ipc = require("node-ipc");

ipc.config.id = "server";
ipc.config.retry = 2000;
ipc.config.silent = true;
ipc.config.sync = true;

module.exports = ({ shader, uniforms }, options, callback) => {
  ipc.serve(() => {
    const spawned = spawn(
      path.join(__dirname, "../node_modules/.bin/electron"),
      [path.join(__dirname, "electron.js")],
      {
        env: Object.assign(
          {
            ELECTRON_DISABLE_SECURITY_WARNINGS: true
          },
          process.env
        )
      }
    );

    spawned.stderr.on("data", data => {
      console.log("[gpu err]", data.toString());
    });

    spawned.stdout.on("data", data => {
      console.log("[gpu]", data.toString());
    });

    ipc.server.on("mesh", (mesh, socket) => {
      ipc.server.emit(socket, "close");
      ipc.server.stop();
      callback(mesh);
    });

    ipc.server.on("did-finish-load", (_, socket) => {
      ipc.server.emit(socket, "shader", { shader, uniforms, options });
    });
  });

  ipc.server.start();
};
