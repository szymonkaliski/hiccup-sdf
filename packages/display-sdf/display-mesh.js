const angleNormals = require("angle-normals");
const createCamera = require("regl-camera");
const createRegl = require("regl");
const memoSync = require("persistent-memo/memo-sync");
const refineMesh = require("refine-mesh");

const implicitMesh = require("./implicit-mesh");

module.exports = (
  sdfShader,
  {
    size = 128,
    textures = {},
    memoize = false,
    refine = false,
    refineOptions = {}
  } = {}
) => {
  const memo = memoize ? memoSync : fn => (...args) => fn(...args);

  const generateMesh = memo((size, sdfShader, textures) => {
    const makeUniforms = regl =>
      Object.keys(textures).reduce(
        (memo, key) =>
          Object.assign({}, memo, {
            [key]: regl.texture({
              data: textures[key],
              type: "float"
            })
          }),
        {}
      );

    let mesh = implicitMesh(size, sdfShader, makeUniforms);
    mesh.normals = angleNormals(mesh.cells, mesh.positions);

    if (refine) {
      mesh = refineMesh(
        mesh.cells,
        mesh.positions,
        mesh.normals,
        refineOptions
      );
      mesh.normals = angleNormals(mesh.cells, mesh.positions);
    }

    return mesh;
  });

  const mesh = generateMesh(size, sdfShader, textures);

  const regl = createRegl();
  const camera = createCamera(regl, { distance: 3 });

  const vert = `
    precision highp float;

    uniform mat4 projection, view;
    attribute vec3 position, normal;
    varying vec3 vNormal, vPosition;
    varying mat4 vView;

    void main () {
      vNormal = normal;
      vPosition = position;
      vView = view;

      gl_Position = projection * view * vec4(position, 1.0);
    }
  `;

  const frag = `
    precision highp float;

    varying vec3 vNormal, vPosition;
    uniform vec3 lightPosition;
    varying mat4 vView;

    float lambert(vec3 lightDirection, vec3 surfaceNormal) {
      return max(0.1, dot(lightDirection, surfaceNormal));
    }

    void main() {
      vec3 lightDirection = normalize(lightPosition - vPosition);
      vec3 normal = (vView * vec4(normalize(vNormal), 0.0)).xyz;
      float power = lambert(lightDirection, normal);

      gl_FragColor = vec4(power, power, power, 1.0);
    }
  `;

  const draw = regl({
    vert,
    frag,
    attributes: {
      position: mesh.positions,
      normal: mesh.normals
    },
    uniforms: {
      lightPosition: [0, 10, 10]
    },
    elements: mesh.cells,
    primitive: "triangles"
  });

  regl.frame(() => {
    camera(({ dirty }) => {
      if (!dirty) return;

      regl.clear({
        color: [0.2, 0.2, 0.2, 1.0]
      });

      draw();
    });
  });

  return regl;
};
