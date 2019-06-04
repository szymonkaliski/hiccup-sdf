const { displayRaw } = require("display-sdf");

const { compileShader, glslHelpers } = require("hiccup-sdf");

const range = length => Array.from({ length }, (_, i) => i);

const steps = range(10).map(i => {
  return [
    "translate",
    { t: [i / 10 - 0.5, 0, 0] },
    [
      [
        "blend",
        { k: i / 10 },
        [["torus", { r1: 0.01, r2: 0.03 }], ["box", { s: [0.03, 0.03, 0.03] }]]
      ]
    ]
  ];
});

const tree = [
  "scale",
  { s: 3.0 },
  [["rotate", { r: [0, 0, 0.4] }, [["union", steps]]]]
];

const { inject, model } = compileShader(tree);
const shader = glslHelpers.createShaderFull(model, inject);

displayRaw(shader);
