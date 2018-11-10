const regl = require("regl")({
  extensions: ["OES_texture_float"]
});
const camera = createCamera(regl);

function createCamera(regl) {
  const element = regl._gl.canvas;

  const state = {
    theta: 0,
    phi: 0,
    distance: 2
  };

  element.addEventListener("mousedown", e => {
    const clickX = e.clientX;
    const clickY = e.clientY;

    const startTheta = state.theta;
    const startPhi = state.phi;

    const onDrag = e => {
      const dx = clickX - e.clientX;
      const dy = clickY - e.clientY;

      const theta = startTheta + dx;
      const phi = Math.min(179.9, Math.max(-179.9, startPhi - dy));

      state.theta = theta;
      state.phi = phi;
    };

    const onUp = () => {
      element.removeEventListener("mousemove", onDrag);
      element.removeEventListener("mouseup", onUp);
    };

    element.addEventListener("mousemove", onDrag);
    element.addEventListener("mouseup", onUp);
  });

  const onScroll = e => {
    e.preventDefault();

    state.distance = Math.max(0, state.distance + e.deltaY / 100);
  };

  element.addEventListener("mousewheel", onScroll);

  return { state };
}

module.exports = (sdfShader, { textures = {} } = {}) => {
  const textureUniforms = Object.keys(textures).reduce(
    (memo, key) =>
      Object.assign({}, memo, {
        [key]: regl.texture({
          data: textures[key],
          type: "float"
        })
      }),
    {}
  );

  const uniforms = Object.assign(
    {
      width: regl.context("viewportWidth"),
      height: regl.context("viewportHeight"),
      camTheta: regl.prop("theta"),
      camPhi: regl.prop("phi"),
      camDistance: regl.prop("distance")
    },
    textureUniforms
  );

  const draw = regl({
    vert: `
      precision highp float;
      attribute vec2 position;
      void main () {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `,
    frag: sdfShader,
    attributes: {
      position: [-4, -4, 4, -4, 0, 4]
    },
    count: 3,
    depth: {
      enable: false
    },
    uniforms
  });

  regl.frame(() => {
    regl.clear({
      color: [0.2, 0.2, 0.2, 1.0]
    });

    draw(camera.state);
  });

  return regl;
};
