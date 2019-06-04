const { displayRaw } = require("display-sdf");
const { compileShader, glslHelpers } = require("hiccup-sdf");

const range = length => Array.from({ length }, (_, i) => i);

const steps = range(10).map(i => {
  return [
    "translate",
    { t: [i / 10 - 0.5, 0, 0] },
    [
      [
        "elongate",
        { s: [0.0, (i / 10) * 0.5, 0.0] },
        [["torus", { r1: 0.001, r2: 0.03 }]]
      ]
    ]
  ];
});

const tree = [
  "scale",
  { s: 1.5 },
  [["rotate", { r: [0.1, 0, -0.25] }, [["union", steps]]]]
];

const { inject, model } = compileShader(tree);
const shader = glslHelpers.createShaderFull(model, inject);

displayRaw(shader);
