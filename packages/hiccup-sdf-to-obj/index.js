const implicitMesh = require("implicit-mesh");
const serializeObj = require("serialize-wavefront-obj");
const { compileFunction } = require("hiccup-sdf");

module.exports = (tree, options, callback) => {
  if (!callback) {
    callback = options;
    options = { size: 128 };
  }

  const compiled = compileFunction(tree);

  const { cells, positions } = implicitMesh(options.size, (x, y, z) =>
    compiled([x, y, z])
  );

  const str = serializeObj(cells, positions);

  callback(str);
};
