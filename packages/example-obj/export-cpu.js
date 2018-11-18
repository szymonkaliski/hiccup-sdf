const fs = require("fs");
const path = require("path");
const sdfToObj = require("hiccup-sdf-to-obj");

const { points } = require("./shared");

const tree = [
  "difference",
  {},
  [
    ["sphere", { r: 0.4 }],
    [
      "map",
      {
        data: { points },
        map: props => [
          "translate",
          { t: props.points },
          [["sphere", { r: 0.1 }]]
        ],
        reduce: ["union", { r: 0.05 }]
      }
    ]
  ]
];

sdfToObj(tree, { size: 64 }, objStr => {
  fs.writeFileSync(path.join(__dirname, "export-cpu.obj"), objStr);
});
