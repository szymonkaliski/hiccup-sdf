const dsl = require("../");

const points = Array.from({ length: 10 }).map(() => [
  Math.random(),
  Math.random(),
  Math.random()
]);

const treeGLSL = [
  "union",
  { r: 0.0 },
  [
    [
      "map",
      {
        data: { points },
        map: props => [
          "translate",
          { t: `${props.points}.xyz` },
          [["sphere", { r: 0.2 }]]
        ],
        reduce: ["union", { r: 0.1 }]
      }
    ],
    ["sphere", { r: 1.0 }]
  ]
];

const { inject, uniforms, model } = dsl.compileShader(treeGLSL);

console.log("- inject\n");
console.log(inject);
console.log();
console.log("- uniforms\n");
console.log(uniforms);
console.log();
console.log("- model\n");
console.log(model);
console.log();

// prettier-ignore
const treeCPU = [
  "union",
  {},
  [
    ["sphere"],
    ["box"],
    [
      "translate",
      { t: [0, 0, -1] },
      [
        ["box"]
      ]
    ]
  ]
];

const cpuFn = dsl.compileFunction(treeCPU);

console.log("- cpuFn\n");
console.log(cpuFn.toString());
console.log("\n- cpuFn([0, 0, 0])\n");
console.log(cpuFn([0, 0, 0]));
console.log();
