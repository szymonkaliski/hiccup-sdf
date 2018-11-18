const ndarray = require("ndarray");
const path = require("path");
const surfaceNets = require("surface-nets");

const { Worker } = require("worker_threads");

const range = length => Array.from({ length }).map((_, i) => i);

const scale = (size, mesh) => {
  const sx = 2 / size[0];
  const sy = 2 / size[1];
  const sz = 2 / size[2];

  const p = mesh.positions;

  for (let i = 0; i < p.length; i++) {
    p[i][0] = p[i][0] * sx - 1;
    p[i][1] = p[i][1] * sy - 1;
    p[i][2] = p[i][2] * sz - 1;
  }

  return mesh;
};

module.exports = (tree, { size = 64, threads = 4 }, callback) => {
  const data = ndarray(new Float64Array(size * size * size), [
    size,
    size,
    size
  ]);

  const doneStatus = range(threads).map(() => false);
  const allDone = () => doneStatus.every(done => done);

  range(threads).map(i => {
    console.time(`worker[${i}]`);

    const worker = new Worker(path.join(__dirname, "worker.js"), {
      workerData: {
        id: i,
        size,
        xs: [
          Math.floor((i * size) / threads),
          Math.floor(((i + 1) * size) / threads)
        ],
        tree
      }
    });

    worker.on("message", msg => {
      console.timeEnd(`worker[${i}]`);

      worker.unref();

      doneStatus[i] = true;

      const { xs } = msg;

      let ii = 0;

      for (let x = xs[0]; x < xs[1]; x++) {
        for (let y = 0; y < size; y++) {
          for (let z = 0; z < size; z++) {
            data.set(x, y, z, msg.data[ii][y][z]);
          }
        }

        ii++;
      }

      if (allDone()) {
        console.time("surfaceNets");
        const mesh = scale([size, size, size], surfaceNets(data));
        console.timeEnd("surfaceNets");
        callback(mesh);
      }
    });
  });
};
