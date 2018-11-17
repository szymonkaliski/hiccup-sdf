const { displayMesh } = require("display-sdf");
const { compileShader, glslHelpers } = require("hiccup-sdf");
const SimplexNoise = require("simplex-noise");
const simplex = new SimplexNoise();

const position = [];

const size = 32;

for (let x = -size / 2; x < size / 2; x = ++x) {
  for (let z = -size / 2; z < size / 2; z = ++z) {
    for (let y = -size / 2; y < size / 2; y = ++y) {
      const nMod = 0.05;
      const n = simplex.noise3D(x * nMod, y * nMod, z * nMod);
      const d = Math.sqrt(x * x + y * y + z * z);

      if (n > 0.5 && d < size * 0.49) {
        position.push([x / size, y / size, z / size]);
      }
    }
  }
}

const tree = [
  "map",
  {
    data: { position },
    map: props => [
      "translate",
      { t: `${props.position}.xyz` },
      [["box", { s: [0.02, 0.02, 0.02] }]]
    ],
    reduce: ["union", { r: 0.0 }]
  }
];

const { inject, uniforms, model } = compileShader(tree);
const shader = glslHelpers.createShaderModel(model, inject);

displayMesh(shader, { textures: uniforms, size: 128, refine: false });
