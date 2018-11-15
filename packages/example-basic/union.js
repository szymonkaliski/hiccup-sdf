const { displayRaw } = require("display-sdf");
const { compileShader, glslHelpers } = require("hiccup-sdf");

const tree = [
  "union",
  { r: 0.1 },
  [
    ["translate", { t: [-0.3, 0, 0] }, [["sphere"]]],
    ["translate", { t: [0.3, 0, 0] }, [["sphere"]]]
  ]
];

const { inject, model } = compileShader(tree);
const shader = glslHelpers.createShaderFull(model, inject);

displayRaw(shader);
