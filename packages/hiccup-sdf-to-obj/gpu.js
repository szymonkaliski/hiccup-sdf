const serializeObj = require("serialize-wavefront-obj");
const spawnGPU = require("./gpu/spawn");
const { compileShader, glslHelpers } = require("hiccup-sdf");

module.exports = (tree, options, callback) => {
  if (!callback) {
    callback = options;
    options = { size: 128 };
  }

  const { inject, uniforms, model } = compileShader(tree);
  const shader = glslHelpers.createShaderModel(model, inject);

  spawnGPU({ shader, uniforms }, options, data => {
    if (data) {
      const { cells, positions } = data;
      const str = serializeObj(cells, positions);
      return callback(str);
    }

    callback();
  });
};
