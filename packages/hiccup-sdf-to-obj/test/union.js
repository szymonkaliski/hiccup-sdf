const path = require("path");
const fs = require("fs");

const sdfToObj = require("../threaded");

const translatedSphere = (t, r) => ["translate", { t }, [["sphere", { r }]]];

// prettier-ignore
const tree = [
  "union",
  { r: 0.01 },
  [
    translatedSphere([-0.1, 0, 0], 0.2),
    translatedSphere([0.1, 0, 0], 0.2)
  ]
];

sdfToObj(tree, { size: 256 }, objStr => {
  fs.writeFileSync(path.join(__dirname, "union.obj"), objStr);
});
