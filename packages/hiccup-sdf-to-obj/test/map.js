const path = require("path");
const fs = require("fs");

const sdfToObj = require("../");

const randomSpherePosition = r => {
  const u = Math.random();
  const v = Math.random();

  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);

  const x = r * Math.sin(phi) * Math.cos(theta);
  const y = r * Math.sin(phi) * Math.sin(theta);
  const z = r * Math.cos(phi);

  return [x, y, z];
};

const range = length => Array.from({ length }, (_, i) => i);

const points = range(100).map(() => randomSpherePosition(0.4));

const tree = [
  "map",
  {
    data: { points },
    map: props => ["translate", { t: props.points }, [["sphere", { r: 0.05 }]]],
    reduce: ["union", { r: 0.01 }]
  }
];

console.time("sdf-to-obj");

sdfToObj(tree, { size: 128 }, objStr => {
  fs.writeFileSync(path.join(__dirname, "map.obj"), objStr);
  console.timeEnd("sdf-to-obj");
});
