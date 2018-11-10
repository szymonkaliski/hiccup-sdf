## 2018-08-10

How ideally the DSL would work:

```js
const shape = opUnionRound( // curried (?)
  0.02,
  sdSphere([0, 0.1, 0.0], 0.2),
  sdSphere([0, 0.1, 0.4], 0.2),
  sdCube([1.0, 0.1, 0.0], [0.1, 0.1, 0.5]),
);
```

This, when run on CPU, should translate into:

```js
const p = [x, y, z]:

const shape = cpuOpUnionRound(
  p,
  cpuSdSphere(p),
  cpuOpUnionRound(
    p,
    cpuSdSphere(p),
    cpuSdCube(p)
  )
);
```

And on GPU:

```glsl
vec3 p = vec3(x, y, z);

float d = gpuOpUnionRound(
  p,
  gpuSdSphere(p),
  gpuOpUnionRound(
    p,
    gpuSdSphere(p),
    gpuSdCube(p)
  )
);
```

Which looks pretty simple, the problem is with running something on array of data.
For CPU we use `map`/`reduce` easily, but for GPU this requires passing data through texture.
Ideally that would be hidden, or abstracted away.

```js
const data = Array.from({ length: 1000 }).map(() => [
  Math.random(),
  Math.random(),
  Math.random()
]);

const shape = combine(data, d => sphere(d, 0.2), opUnionRound(0.2));
```

Which on GPU should produce:

1. `data` texture
2. looping over the code:

````glsl

float d = 0;

for (int i = 0; i < textureWidth; i++) {
  for (int j = 0; j < textureHeight; j++) {
    vec2 uv = vec2(float(i) / textureWidth, float(j) / textureHeight);
    vec3 p = texture2D(dataTexture, uv);

    d = opUnionRound(0.02, d, sphere(p, 0.2));
  }
}

return d;
```

What if there's two data sources?

```js
const p1s = Array.from({ length: 1000 }).map(() => [
  Math.random(),
  Math.random(),
  Math.random()
]);

const p2s = Array.from({ length: 1000 }).map(() => [
  Math.random(),
  Math.random(),
  Math.random()
]);

const shape = combine([p1s, p2s], [p1, p2] => capsule(p1, p2, 0.2), opUnionRound(0.2));
```

Which should turn into:

```glsl
float d = 0;

for (int i = 0; i < textureWidth; i++) {
  for (int j = 0; j < textureHeight; j++) {
    vec2 uv = vec2(float(i) / textureWidth, float(j) / textureHeight);

    vec3 p1 = texture2D(dataTexture1, uv);
    vec3 p2 = texture2D(dataTexture2, uv);

    d = opUnionRound(0.02, d, sdCapsule(p, p1, p2, 0.2));

  }
}

return d;
```

## 2018-08-11

Thinking of using hiccup-like syntax for building geometries:

```js
const geom = [
  unionRound,
  { r: 0.02 },
  [
    [sdSphere, { r: 0.1, p: [0.0, 0.2, 0.3] }]
    [sdCube, { p: [0.0, 0.2, 0.3], s: [1.0, 1.0, 1.0] }]
  ]
];
```

Or maybe even:

```js
const geom = [
  "unionRound",
  { r: 0.02 },
  [
    ["sphere", { r: 0.1, p: [0.0, 0.2, 0.3] }]
    ["cube", { p: [0.0, 0.2, 0.3], s: [1.0, 1.0, 1.0] }]
  ]
];
```

And for large data:

```js
const geom = [
  withDataset,
  {
    data: somePositions,
    op: [opUnionRound, { r: 0.02 }],
    mapper: [mapProp, { prop: "p" }, sdSphere, { r: 0.01 }]
  }
];
```

Or maybe:

```js
const geom1 = [
  "mapReduce",
  {
    data: [somePositions],
    map: {
      props: ["pos"],
      types: ["vec3"],
      geom: ["sphere", { r: 0.01 }]
    },
    reduce: ["unionRound", { r: 0.02 }],
  }
];

const geom2 = [
  "mapReduce",
  {
    data: [fromPositions, toPositions],
    map: {
      props: ["a", "b"],
      types: ["vec3", "vec3"],
      geom: ["pill", { r: 0.05 }]
    },
    reduce: ["unionRound", { r: 0.02 }],
  }
];
```

## 2018-08-12

Tools needed:

1. hiccup-sdf
  - sd shapes
  - csg
  - operations (space bending, repeat, etc.)
2. sdf-mesher
  - backends:
    - cpu (default)
    - threaded-cpu (node v10.5.0+)
    - gpu (webgl)
    - webworker-cpu (later)
  - dims `[x,y,z]` (so I can do high-quality x, but low-quality y/z)
3. examples!
4. UI for playing with hiccup-sdf and changing parameters with ad-hoc UIs

With this I could do:

- basic modeling:
  - arranging cubes, spheres, unions to build a thing
- small algae growth between two planes, repeat six tames, and arrange into hexagon
- algae growth between two spheres
- flow-field paths

Links:

- http://www.iquilezles.org/www/articles/distfunctions/distfunctions.htm
- http://mercury.sexy/hg_sdf/

Another cool thing about hiccup-like tree syntax is that parts of the trees can be replanted easily.

