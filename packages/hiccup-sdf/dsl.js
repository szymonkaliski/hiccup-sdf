const v = require("@thi.ng/vectors");
const { uniq, flatten, without } = require("lodash");

const GLSL_STL = require("./glsl-stl");

const GLSL = "GLSL";
const CPU = "CPU";

const copy = a => a.slice(0);
const clamp = (v, min, max) => Math.max(Math.min(v, max), min);
const length2 = ([x, y]) => Math.sqrt(x * x + y * y);
const length3 = ([x, y, z]) => Math.sqrt(x * x + y * y + z * z);
const range = length => Array.from({ length }).map((_, i) => i);
const flatArray = t => (Array.isArray(t) ? flatten(t) : [t]);
const formatNonString = (t, format) => (typeof t !== "string" ? format(t) : t);

const GL = {
  vec3: v =>
    formatNonString(
      v,
      ([x, y, z]) => `vec3(${GL.f(x)}, ${GL.f(y)}, ${GL.f(z)})`
    ),
  f: n => formatNonString(n, n => n.toFixed(8)),
  i: n => formatNonString(n, n => Math.round(n))
};

const SHAPE = {
  sphere: {
    defaultProps: {
      r: 0.5
    },
    [CPU]: { generate: props => p => length3(p) - props.r },
    [GLSL]: {
      generate: props => p => `sdSphere(${p}, ${GL.f(props.r)})`,
      inject: () => GLSL_STL.SD_SPHERE
    }
  },

  box: {
    defaultProps: {
      s: [0.1, 0.1, 0.1]
    },
    [CPU]: {
      generate: props => p => {
        const d = v.sub3(v.abs3(p), props.s);

        return (
          Math.min(Math.max(d[0], Math.max(d[1], d[2])), 0.0) +
          length3(v.max3(d, [0, 0, 0]))
        );
      }
    },
    [GLSL]: {
      generate: props => p => `sdBox(${p}, ${GL.vec3(props.s)})`,
      inject: () => GLSL_STL.SD_BOX
    }
  },

  torus: {
    defaultProps: {
      r1: 0.1,
      r2: 0.2
    },
    [CPU]: {
      generate: props => p => {
        const q = [length2([p[0], p[2]]) - props.r2, p[1]];
        return length2(q) - props.r1;
      }
    },
    [GLSL]: {
      generate: props => p =>
        `sdTorus(${p}, ${GL.f(props.r1)}, ${GL.f(props.r2)})`,
      inject: () => GLSL_STL.SD_TORUS
    }
  },

  hex: {
    defaultProps: {
      h: 0.01,
      r: 0.2
    },
    [CPU]: {
      generate: props => p => {
        const q = v.abs3(p);

        return Math.max(
          q[2] - props.h,
          Math.max(q[0] * 0.866025 + q[1] * 0.5, q[1]) - props.r
        );
      }
    },
    [GLSL]: {
      generate: props => p => `sdHex(${p}, ${GL.f(props.r)}, ${GL.f(props.h)})`,
      inject: () => GLSL_STL.SD_HEX
    }
  },

  triangle: {
    defaultProps: {
      h: 0.01,
      r: 0.2
    },
    [CPU]: {
      generate: props => p => {
        const q = v.abs3(p);

        // FIXME: not a triangle?
        return Math.max(
          q[2] - props.h,
          Math.max(q[0] * 0.866025 + p[1] * 0.5, -p[1]) - props.r * 0.5
        );
      }
    },
    [GLSL]: {
      generate: props => p =>
        `sdTriangle(${p}, ${GL.f(props.r)}, ${GL.f(props.h)})`,
      inject: () => GLSL_STL.SD_TRIANGLE
    }
  },

  capsule: {
    defaultProps: {
      a: [0, 0, 0],
      b: [0, 0, 0.2],
      r: 0.1
    },
    [CPU]: {
      generate: props => p => {
        const pa = v.sub3(copy(p), props.a);
        const ba = v.sub3(copy(props.b), props.a);

        const h = clamp(v.dot3(pa, ba) / v.dot3(ba, ba), 0.0, 1.0);

        return length3(v.sub3(pa, v.mulN3(ba, h))) - props.r;
      }
    },
    [GLSL]: {
      generate: props => p =>
        `sdCapsule(
          ${p},
          ${GL.vec3(props.a)},
          ${GL.vec3(props.b)},
          ${GL.f(props.r)}
        )`,
      inject: () => GLSL_STL.SD_CAPSULE
    }
  },

  cylinder: {
    defaultProps: {
      r: 0.1,
      h: 0.3
    },
    [CPU]: {
      generate: props => p => {
        const d = v.sub2(v.abs2([length2([p[0], p[2]]), p[1]]), [
          props.r,
          props.h
        ]);

        return (
          Math.min(Math.max(d[0], d[1]), 0.0) + length2(v.max2(d, [0.0, 0.0]))
        );
      }
    },
    [GLSL]: {
      generate: props => p =>
        `sdCylinder(${p}, ${GL.f(props.r)}, ${GL.f(props.h)})`,
      inject: () => GLSL_STL.SD_CYLINDER
    }
  }
};

const OP = {
  translate: {
    defaultProps: {
      t: [0, 0, 0]
    },
    [CPU]: {
      generate: (props, children) =>
        reduceChildrenCPU(children, { process: p => v.sub3(copy(p), props.t) })
    },
    [GLSL]: {
      generate: (props, children) =>
        reduceChildrenGLSL(children, {
          process: p => `${p} - ${GL.vec3(props.t)}`
        })
    }
  },

  scale: {
    defaultProps: {
      s: 0.5
    },
    [CPU]: {
      generate: (props, children) => {
        return o => {
          const p = v.divN3(o, props.s);

          let d = children[0](p) * props.s;

          for (let i = 1; i < children.length; i++) {
            d = Math.min(d, children[i](p)) * props.s;
          }

          return d;
        };
      }
    },
    [GLSL]: {
      generate: (props, children) => o => {
        const { s } = props;
        const p = `${o} / ${GL.f(s)}`;

        return children
          .slice(1)
          .reduce(
            (memo, child) => reducer(memo, `${child(p)} * ${GL.f(s)}`),
            `${children[0](p)} * ${GL.f(s)}`
          );
      }
    }
  },

  rotate: {
    defaultProps: {
      r: [0.0, 0.0, 0.0]
    },
    [CPU]: {
      generate: (props, children) =>
        reduceChildrenCPU(children, {
          process: p => {
            const { r } = props;
            const { sin, cos } = Math;
            const TAU = Math.PI * 2;

            const rxz = p => [
              cos(r[0] * TAU) * p[0] + sin(r[0] * TAU) * p[2],
              p[1],
              cos(r[0] * TAU) * p[2] + sin(r[0] * TAU) * -p[0]
            ];

            const rxy = p => [
              cos(r[1] * TAU) * p[0] + sin(r[1] * TAU) * p[1],
              cos(r[1] * TAU) * p[1] + sin(r[1] * TAU) * -p[0],
              p[2]
            ];

            const ryz = p => [
              p[0],
              cos(r[2] * TAU) * p[1] + sin(r[2] * TAU) * p[2],
              cos(r[2] * TAU) * p[2] + sin(r[2] * TAU) * -p[1]
            ];

            return ryz(rxy(rxz(p)));
          }
        })
    },
    [GLSL]: {
      generate: (props, children) =>
        reduceChildrenGLSL(children, {
          process: p => `opRotate(${p}, ${GL.vec3(props.r)})`
        }),
      inject: () => GLSL_STL.OP_ROTATE
    }
  },

  elongate: {
    defaultProps: {
      s: [0.1, 0.1, 0.1]
    },
    [CPU]: {
      generate: () =>
        reduceChildrenCPU(children, {
          process: p => v.max3(v.sub3(v.abs3(p), props.s), [0, 0, 0])
        })
    },
    [GLSL]: {
      generate: (props, children) =>
        reduceChildrenGLSL(children, {
          process: p => `opElongate(${p}, ${GL.vec3(props.s)})`
        }),
      inject: () => GLSL_STL.OP_ELONGATE
    }
  },

  mirror: {
    defaultProps: {
      m: [0.5, 0.0, 0]
    },
    [CPU]: {
      generate: (props, children) =>
        reduceChildrenCPU(children, {
          process: p => [
            props.m[0] > 0 ? Math.abs(p[0]) - props.m[0] : p[0],
            props.m[1] > 0 ? Math.abs(p[1]) - props.m[1] : p[1],
            props.m[2] > 0 ? Math.abs(p[2]) - props.m[2] : p[2]
          ]
        })
    },
    [GLSL]: {
      generate: (props, children) =>
        reduceChildrenGLSL(children, {
          process: p => `opMirror(${p}, ${GL.vec3(props.m)})`
        }),
      inject: () => GLSL_STL.OP_MIRROR
    }
  },

  repeat: {
    defaultProps: {
      r: [1.0, 0.0, 0.0]
    },
    [CPU]: {
      generate: (props, children) =>
        reduceChildrenCPU(children, {
          process: p => [
            props.r[0] > 0
              ? ((p[0] + props.r[0] / 2) % props.r[0]) - props.r[0] / 2
              : p[0],
            props.r[1] > 0
              ? ((p[1] + props.r[1] / 2) % props.r[1]) - props.r[1] / 2
              : p[1],
            props.r[2] > 0
              ? ((p[2] + props.r[2] / 2) % props.r[2]) - props.r[2] / 2
              : p[2]
          ]
        })
    },
    [GLSL]: {
      generate: (props, children) =>
        reduceChildrenGLSL(children, {
          process: p => `opRepeat(${p}, ${GL.vec3(props.r)})`
        }),
      inject: () => GLSL_STL.OP_REPEAT
    }
  },

  repeatPolar: {
    defaultProps: {
      r: 6
    },
    [CPU]: {
      generate: (props, children) =>
        reduceChildrenCPU(children, {
          process: p => {
            // FIXME: this is broken

            const angle = (Math.PI * 2.0) / props.r;
            const a = Math.atan2(p[1], p[0]) + angle / 2.0;
            const l = length2([p[0], p[1]]);

            const aa = (a % angle) - angle / 2.0;

            return [Math.cos(aa) * l, Math.sin(aa) * l, p[2]];
          }
        })
    },
    [GLSL]: {
      generate: (props, children) =>
        reduceChildrenGLSL(children, {
          process: p => `opRepeatPolar(${p}, ${GL.f(props.r)})`
        }),
      inject: () => GLSL_STL.OP_REPEAT_POLAR
    }
  },

  union: {
    defaultProps: {
      r: 0
    },
    [CPU]: {
      generate: (props, children) => {
        const unionRound = (a, b) => {
          const u = v.max2([props.r - a, props.r - b], [0, 0]);
          return Math.max(props.r, Math.min(a, b)) - length2(u);
        };

        const union = props.r > 0 ? unionRound : Math.min;

        return reduceChildrenCPU(children, { reducer: union });
      }
    },
    [GLSL]: {
      generate: (props, children) =>
        reduceChildrenGLSL(children, {
          reducer: (a, b) =>
            props.r > 0
              ? `opUnionRound(${a}, ${b}, ${GL.f(props.r)})`
              : `opUnion(${a}, ${b})`
        }),
      inject: props =>
        props.r > 0 ? GLSL_STL.OP_UNION_ROUND : GLSL_STL.OP_UNION
    }
  },

  intersection: {
    defaultProps: {
      r: 0
    },
    [CPU]: {
      generate: (props, children) => {
        const intersectionRound = (a, b) => {
          const u = v.max2([props.r + a, props.r + b], [0, 0]);
          return Math.min(-props.r, Math.max(a, b)) + length2(u);
        };

        const intersection = props.r > 0 ? intersectionRound : Math.max;

        return reduceChildrenCPU(children, { reducer: intersection });
      }
    },
    [GLSL]: {
      generate: (props, children) =>
        reduceChildrenGLSL(children, {
          reducer: (a, b) =>
            props.r > 0
              ? `opIntersectionRound(${a}, ${b}, ${GL.f(props.r)})`
              : `opIntersection(${a}, ${b})`
        }),
      inject: props =>
        props.r > 0 ? GLSL_STL.OP_INTERSECTION_ROUND : GLSL_STL.OP_INTERSECTION
    }
  },

  difference: {
    defaultProps: {
      r: 0
    },
    [CPU]: {
      generate: (props, children) => {
        const differenceRound = (a, b) => {
          const u = v.max2([props.r + a, props.r - b], [0, 0]);
          return Math.min(-props.r, Math.max(a, -b)) + length2(u);
        };

        const difference =
          props.r > 0 ? differenceRound : (a, b) => Math.max(a, -b);

        return reduceChildrenCPU(children, { reducer: difference });
      }
    },
    [GLSL]: {
      generate: (props, children) =>
        reduceChildrenGLSL(children, {
          reducer: (a, b) =>
            props.r > 0
              ? `opDifferenceRound(${a}, ${b}, ${GL.f(props.r)})`
              : `opDifference(${a}, ${b})`
        }),
      inject: props =>
        props.r > 0 ? GLSL_STL.OP_DIFFERENCE_ROUND : GLSL_STL.OP_DIFFERENCE
    }
  },

  blend: {
    defaultProps: {
      k: 0.5
    },
    [CPU]: {
      generate: (props, children) => {
        const blend = (a, b) => (1.0 - props.k) * a + props.k * b;
        return reduceChildrenCPU(children, { reducer: blend });
      }
    },
    [GLSL]: {
      generate: (props, children) =>
        reduceChildrenGLSL(children, {
          reducer: (a, b) => `opBlend(${a}, ${b}, ${GL.f(props.k)})`
        }),

      inject: () => GLSL_STL.OP_BLEND
    }
  },

  map: {
    defaultProps: {
      reduce: ["union", { r: 0.0 }]
    },
    [CPU]: {
      generate: props => {
        const largestLength = Object.keys(props.data).reduce(
          (memo, key) => Math.max(memo, props.data[key].length),
          0
        );

        const reducer = children =>
          OP[props.reduce[0]][CPU].generate(props.reduce[1], children);

        return p => {
          let d;

          for (let i = 0; i < largestLength; i++) {
            const currentData = Object.keys(props.data).reduce((memo, key) => {
              return Object.assign(memo, { [key]: props.data[key][i] });
            }, {});

            const mapD = compile(props.map(currentData), { type: CPU }).model;

            if (!d) {
              d = mapD(p);
            } else {
              d = reducer([() => d, p => mapD(p)])(p);
            }
          }

          return d;
        };
      }
    },
    [GLSL]: {
      generate: props => p => `map${props.key}(${p})`,

      uniforms: props => {
        const largestTexLength = Object.keys(props.data).reduce(
          (memo, key) => Math.max(memo, props.data[key].length),
          0
        );

        const texSize = Math.ceil(Math.sqrt(largestTexLength));

        const ensureArraySize = (arr, length, empty = 0) =>
          range(length).map(i => (arr[i] !== undefined ? arr[i] : empty));

        const squareArray = (arr, size, empty = 0) => {
          return range(size).map(i =>
            range(size).map(j => {
              const idx = i * size + j;

              return ensureArraySize(
                idx < arr.length ? arr[idx] : empty,
                4,
                empty
              );
            })
          );
        };

        return Object.keys(props.data).reduce(
          (memo, key) =>
            Object.assign(memo, {
              [`${key}${props.key}Tex`]: squareArray(props.data[key], texSize)
            }),
          {}
        );
      },

      inject: props => {
        const largestTexLength = Object.keys(props.data).reduce(
          (memo, key) => Math.max(memo, props.data[key].length),
          0
        );

        const texSize = Math.ceil(Math.sqrt(largestTexLength));

        const [reduceOp, reduceProps] = props.reduce;

        const { generate: reduceGenerate, inject: reduceInject } = OP[reduceOp][
          GLSL
        ];

        const childTree = props.map(
          Object.keys(props.data).reduce(
            (memo, key) => Object.assign(memo, { [key]: key }),
            {}
          )
        );

        const { model: childModel, inject: childInject } = compile(childTree, {
          type: GLSL
        });

        const reduceChildren = [() => "value", childModel];

        return [
          reduceInject(reduceProps),
          childInject,
          `
${Object.keys(props.data)
  .map(key => `uniform sampler2D ${key}${props.key}Tex;`)
  .join("\n")}

float map${props.key}(vec3 p) {
  float value = 0.0;

  for (int i = 0; i < ${GL.i(texSize)}; i++) {
    for (int j = 0; j < ${GL.i(texSize)}; j++) {
      if (i + j * ${GL.i(texSize)} >= ${GL.i(largestTexLength)}) {
        break;
      }

      vec2 uv = vec2(
        float(i) / ${GL.f(texSize)},
        float(j) / ${GL.f(texSize)}
      );

${Object.keys(props.data)
  .map(key => `      vec4 ${key} = texture2D(${key}${props.key}Tex, uv);`)
  .join("\n")}

      if (i == 0 && j == 0) {
        value = ${childModel("p")};
      }
      else {
        value = ${reduceGenerate(reduceProps, reduceChildren)("p")};
      }
    }
  }

  return value;
}`
        ];
      }
    }
  }
};

const isShape = shape => Object.keys(SHAPE).includes(shape);
const isOp = op => Object.keys(OP).includes(op);

function reduceChildrenCPU(children, { reducer = Math.min, process = p => p }) {
  return o => {
    const p = process(o);

    let d = children[0](p);

    for (let i = 1; i < children.length; i++) {
      d = reducer(d, children[i](p));
    }

    return d;
  };
}

function reduceChildrenGLSL(
  children,
  { reducer = (a, b) => `min(${a}, ${b})`, process = p => p }
) {
  return o => {
    const p = process(o);

    if (children.length === 1) {
      return children[0](p);
    }

    return children
      .slice(1)
      .reduce((memo, child) => reducer(memo, child(p)), children[0](p));
  };
}

function preProcessTree(tree) {
  let counter = 0;

  const preProcess = tree => {
    counter++;

    if (Array.isArray(tree)) {
      if (Array.isArray(tree[1])) {
        tree[2] = tree[1];
        tree[1] = undefined;
      }

      if (!tree[1]) {
        tree[1] = {};
      }

      if (tree[1].key === undefined) {
        tree[1].key = counter;
      }

      if (tree[2]) {
        tree[2].forEach(child => preProcessTree(child));
      }
    }
  };

  const output = tree.slice(0);

  preProcess(output);

  return output;
}

function compile(inputTree, { type = GLSL }) {
  tree = preProcessTree(inputTree);

  if (Array.isArray(tree)) {
    const id = tree[0];

    if (isShape(id)) {
      const { defaultProps } = SHAPE[id];
      const { generate, inject } = SHAPE[id][type];

      const props = Object.assign({}, defaultProps, tree[1]);

      return {
        model: generate ? generate(props) : undefined,
        inject: inject ? inject(props) : undefined
      };
    }

    if (isOp(id)) {
      const { defaultProps } = OP[id];
      const { generate, inject, uniforms } = OP[id][type];

      const props = Object.assign({}, defaultProps, tree[1]);
      const children = (tree[2] || []).map(child => compile(child, { type }));

      const finalInject = flatArray([
        inject ? inject(props) : undefined,
        ...children.map(({ inject }) => inject)
      ]);

      const finalUniforms = flatArray([
        uniforms ? uniforms(props) : undefined,
        ...children.map(({ uniforms }) => uniforms)
      ]);

      return {
        model: generate
          ? generate(props, children.map(({ model }) => model))
          : undefined,
        uniforms: finalUniforms,
        inject: finalInject
      };
    }
  }

  if (typeof args === "function") {
    return compile(args(), { type });
  }

  console.warn("tree not recognized", tree);
  return;
}

const compileFunction = tree => {
  return compile(tree, { type: CPU }).model;
};

const compileShader = tree => {
  const result = compile(tree, { type: GLSL });

  return {
    model: result.model("p"),
    uniforms: without(result.uniforms, undefined).reduce(
      (a, b) => Object.assign(a, b),
      {}
    ),
    inject: without(uniq(flatArray(result.inject)), undefined).join("\n")
  };
};

module.exports = { preProcessTree, compile, compileFunction, compileShader };
