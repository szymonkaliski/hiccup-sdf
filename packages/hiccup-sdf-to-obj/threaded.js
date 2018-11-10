const serializeObj = require("serialize-wavefront-obj");
const threadedImplicitMesh = require("./threaded/implicit-mesh");

module.exports = (tree, options, callback) => {
  if (!callback) {
    callback = options;
    options = { size: 128, threads: 4 };
  }

  threadedImplicitMesh(tree, options, ({ cells, positions }) => {
    const str = serializeObj(cells, positions);
    callback(str);
  });
};
