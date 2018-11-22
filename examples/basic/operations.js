const { displayRaw } = require("display-sdf");
const { compileShader, glslHelpers } = require("hiccup-sdf");

const t = ([x, y], children) => ["translate", { t: [x, 0, y] }, [children]];
const b = ["box", { s: [0.05, 0.05, 0.05] }];

const b2 = [
  t([-0.04, 0], b),
  t([0.04, 0], ["rotate", { r: [0, 0, 0.25] }, [b]])
];

const shapes = [
  t([-0.6, -0.6], ["union", b2]),
  t([-0.6, -0.3], ["union", { r: 0.05 }, b2]),
  t([-0.6, 0.0], ["intersection", b2]),
  t([-0.6, 0.3], ["difference", b2]),

  t([-0.2, -0.3], ["scale", { s: 0.5 }, [b]]),
  t([-0.2, 0.0], ["rotate", { r: [0.25, 0.25, 0] }, [b]]),
  t([-0.2, 0.3], ["mirror", { m: [0.075, 0, 0] }, [b]]),

  t([0.3, 0.0], ["repeat", { r: [0.0, 0.0, 0.25] }, [b]]),
  t([0.7, 0.0], ["repeatPolar", { r: 6 }, [t([0.25, 0], b)]])
];

const tree = ["rotate", { r: [0, 0, 0.25] }, [["union", shapes]]];

const { inject, model } = compileShader(tree);
const shader = glslHelpers.createShaderFull(model, inject);

displayRaw(shader);
