const createRegl = require("regl");
const ndarray = require("ndarray");
const surfaceNets = require("surface-nets");

const scale = (size, mesh) => {
  const sx = 2 / size[0];
  const sy = 2 / size[1];
  const sz = 2 / size[2];

  let p = mesh.positions;

  for (let i = 0; i < p.length; i++) {
    p[i][0] = p[i][0] * sx - 1;
    p[i][1] = p[i][1] * sy - 1;
    p[i][2] = p[i][2] * sz - 1;
  }

  return mesh;
};

const st = n => String(n).replace(/^(\d+)$/, "$1.0");

module.exports = (s, src, makeUniforms) => {
  const size = Array.isArray(s) ? s : [s, s, s];
  const len = size[0] * size[1] * size[2];

  const sx = st(size[0]);
  const sy = st(size[1]);
  const sz = st(size[2]);

  const isx = st(2 / (size[0] - 1));
  const isy = st(2 / (size[1] - 1));
  const isz = st(2 / (size[2] - 1));

  const isxy = st(1 / (size[0] * size[1]));

  const sq = Math.ceil(Math.sqrt(len));

  const canvas = document.createElement("canvas");
  const regl = createRegl({
    canvas,
    extensions: ["oes_texture_float"]
  });

  const magic = {
    "64,64,64": (sq + size[0] * 4) * 4,
    "128,128,128": (sq + size[0] * 16) * 4,
    "100,100,100": (sq + size[0] * 10) * 4,
    "50,50,50": (sq + size[0] * 2 + 18) * 4
  };

  const draw = regl({
    framebuffer: regl.prop("framebuffer"),
    frag: `
      precision highp float;

      ${src}

      float isurface(float i) {
        float x = mod(i, ${sx}) * ${isx} - 1.0;
        float y = mod(i / ${sx}, ${sy}) * ${isy} - 1.0;
        float z = mod(i * ${isxy}, ${sz}) * ${isz} - 1.0;

        return clamp(0.5 + doModel(vec3(x, y, z)).x, 0.0, 1.0);
      }

      void main() {
        float i = (gl_FragCoord.x + gl_FragCoord.y * ${st(sq)})
          * 4.0 + ${st(magic[size] || 0)};

        gl_FragColor = vec4(
          isurface(i + 0.0),
          isurface(i + 1.0),
          isurface(i + 2.0),
          isurface(i + 3.0)
        );
      }
    `,
    vert: `
      precision highp float;
      attribute vec2 position;

      void main () {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `,
    attributes: {
      position: [-4, 4, 4, 4, 0, -4]
    },
    uniforms: makeUniforms ? makeUniforms(regl) : {},
    count: 3,
    depth: {
      enable: false
    }
  });

  regl.clear({ color: [0, 0, 0, 1], depth: true });

  const framebuffer = regl.framebuffer({
    width: sq,
    height: sq,
    colorFormat: "rgba",
    colorType: "uint8"
  });

  let mesh = {};

  draw({ framebuffer }, function() {
    regl.draw();

    const data = regl.read();
    const iv = 1 / 127.5;
    const ndata = new Float32Array(len);

    for (let i = 0; i < data.length; i++) {
      ndata[i] = (data[i] - 127.5) * iv;
    }

    mesh = scale(size, surfaceNets(ndarray(ndata, size)));
  });

  regl.destroy();

  return mesh;
};
