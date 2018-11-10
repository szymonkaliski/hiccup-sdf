const { workerData, parentPort } = require("worker_threads");
const dsl = require("hiccup-sdf");

const { id, size, xs, tree } = workerData;

console.log(`worker[${id}]`, size, xs);

let data = [];

const sdfFunction = dsl.compileFunction(tree);

console.time(`worker[${id}]`);

let x = 0;
for (let i = xs[0]; i < xs[1]; i++) {
  if (!data[x]) {
    data[x] = [];
  }

  for (let y = 0; y < size; y++) {
    if (!data[x][y]) {
      data[x][y] = [];
    }

    for (let z = 0; z < size; z++) {
      const j = y;
      const k = z;

      const value = sdfFunction([
        (i / size) * 2 - 1,
        (j / size) * 2 - 1,
        (k / size) * 2 - 1
      ]);

      data[x][y][z] = value;
    }
  }

  x++;
}

console.timeEnd(`worker[${id}]`);

parentPort.postMessage({ data, xs, id });
parentPort.unref();
