const { displayRaw } = require("display-sdf");
const { compileShader, glslHelpers } = require("hiccup-sdf");

const t = ([x, y], children) => ["translate", { t: [x, 0, y] }, [children]];

const shapes = [
  t([0.0, -0.2], ["box", { s: [0.05, 0.05, 0.05] }]),
  t([0.0, 0.0], ["sphere", { r: 0.05 }]),
  t([0.0, 0.2], ["torus", { r1: 0.025, r2: 0.05 }]),
  t([0.2, -0.2], ["hex", { r: 0.05, h: 0.025 }]),
  t([0.2, 0.0], ["triangle", { r: 0.05, h: 0.025 }]),
  t([0.2, 0.2], ["capsule", { a: [-0.025, 0, 0], b: [0.025, 0, 0], r: 0.025 }]),
  t([-0.2, -0.2], ["cylinder", { r: 0.05, h: 0.025 }])
];

const tree = [
  "scale",
  { s: 3.0 },
  [["rotate", { r: [0, 0, 0.25] }, [["union", shapes]]]]
];

const { inject, model } = compileShader(tree);
const shader = glslHelpers.createShaderFull(model, inject);

displayRaw(shader);
