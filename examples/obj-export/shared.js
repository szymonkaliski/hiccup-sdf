const randomSpherePosition = r => {
  const u = Math.random();
  const v = Math.random();

  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);

  const x = r * Math.sin(phi) * Math.cos(theta);
  const y = r * Math.sin(phi) * Math.sin(theta);
  const z = r * Math.cos(phi);

  return [x, y, z];
};

const range = length => Array.from({ length }, (_, i) => i);

const points = range(100).map(() => randomSpherePosition(0.4));

module.exports = { points };
