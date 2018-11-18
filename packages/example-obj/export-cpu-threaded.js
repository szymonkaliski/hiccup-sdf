const fs = require("fs");
const path = require("path");
const sdfToObj = require("hiccup-sdf-to-obj/threaded");

const { points } = require("./shared");

// map function is currently not supported for threaded cpu export,
// use gpu export, or flatten the tree:

const tree = [
  "difference",
  {},
  [
    ["sphere", { r: 0.4 }],
    [
      "union",
      { r: 0.05 },
      points.map(t => ["translate", { t }, [["sphere", { r: 0.1 }]]])
    ]
  ]
];

sdfToObj(tree, { size: 256 }, objStr => {
  fs.writeFileSync(path.join(__dirname, "export-cpu-threaded.obj"), objStr);
});
