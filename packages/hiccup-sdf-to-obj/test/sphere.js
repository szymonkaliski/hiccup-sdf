const path = require("path");
const fs = require("fs");

const sdfToObj = require("../threaded");

const tree = ["sphere"];

sdfToObj(tree, objStr => {
  fs.writeFileSync(path.join(__dirname, "sphere.obj"), objStr);
});
