const path = require("path");
const spawnMesher = require("./spawn");

console.time("mesher");
spawnMesher(path.join(__dirname, "../objects/01.js"), (err, data) => {
  console.timeEnd("mesher");

  // if (err) {
  //   console.error("err", err);
  // }

  // if (data) {
  //   console.log(data);
  // }
});
