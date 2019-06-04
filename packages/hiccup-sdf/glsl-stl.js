const SD_SPHERE = `
float sdSphere(vec3 p, float r) {
  return length(p) - r;
}`;

const SD_BOX = `
float sdBox(vec3 p, vec3 s) {
  vec3 d = abs(p) - s;
  return min(max(d.x, max(d.y, d.z)), 0.0) + length(max(d, 0.0));
}`;

const SD_TORUS = `
float sdTorus(vec3 p, float r1, float r2) {
  vec2 q = vec2(length(p.xz) - r2, p.y);
  return length(q) - r1;
}`;

const SD_HEX = `
float sdHex(vec3 p, float r, float h) {
  vec3 q = abs(p);
  return max(q.z - h, max((q.x * 0.866025 + q.y * 0.5), q.y) - r);
}`;

const SD_TRIANGLE = `
float sdTriangle(vec3 p, float r, float h) {
  vec3 q = abs(p);
  return max(q.z - h, max(q.x * 0.866025 + p.y * 0.5, -p.y) - r * 0.5);
}`;

const SD_CAPSULE = `
float sdCapsule(vec3 p, vec3 a, vec3 b, float r) {
  vec3 pa = p - a;
  vec3 ba = b - a;

  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);

  return length(pa - ba * h) - r;
}`;

const SD_CYLINDER = `
float sdCylinder(vec3 p, float r, float h) {
  vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h);
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}`;

const OP_ROTATE = `
vec3 opRotate(vec3 p, vec3 r) {
  float PI = 3.14159265359;

  p.xz = cos(r.x * PI) * p.xz + sin(r.x * PI) * vec2(p.z, -p.x);
  p.xy = cos(r.y * PI) * p.xy + sin(r.y * PI) * vec2(p.y, -p.x);
  p.yz = cos(r.z * PI) * p.yz + sin(r.z * PI) * vec2(p.z, -p.y);

  return p;
}`;

const OP_MIRROR = `
vec3 opMirror(vec3 p, vec3 m) {
  if (abs(m.x) > 0.0) { p.x = abs(p.x) - m.x; }
  if (abs(m.y) > 0.0) { p.y = abs(p.y) - m.y; }
  if (abs(m.z) > 0.0) { p.z = abs(p.z) - m.z; }

  return p;
}`;

const OP_REPEAT = `
vec3 opRepeat(vec3 p, vec3 r) {
  vec3 halfR = r * 0.5;

  if (r.x > 0.0) { p.x = mod(p.x + halfR.x, r.x) - halfR.x; }
  if (r.y > 0.0) { p.y = mod(p.y + halfR.y, r.y) - halfR.y; }
  if (r.z > 0.0) { p.z = mod(p.z + halfR.z, r.z) - halfR.z; }

  return p;
}`;

const OP_REPEAT_POLAR = `
vec3 opRepeatPolar(vec3 p, float r) {
  float PI = 3.14159265359;

  float angle = 2.0 * PI / r;

  float a = atan(p.y, p.x) + angle / 2.0;
  float l = length(p.xy);

  a = mod(a, angle) - angle / 2.0;

  p.xy = vec2(cos(a), sin(a)) * l;

  return p;
}`;

const OP_UNION = `
float opUnion(float a, float b) {
  return min(a, b);
}`;

const OP_UNION_ROUND = `
float opUnionRound(float a, float b, float r) {
  vec2 u = max(vec2(r - a, r - b), vec2(0.0));
  return max(r, min(a, b)) - length(u);
}`;

const OP_INTERSECTION = `
float opIntersection(float a, float b) {
  return max(a, b);
}`;

const OP_INTERSECTION_ROUND = `
float opIntersectionRound(float a, float b, float r) {
  vec2 u = max(vec2(r + a, r + b), vec2(0.0));
  return min(-r, max(a, b)) + length(u);
}`;

const OP_DIFFERENCE = `
float opDifference(float a, float b) {
  return max(a, -b);
}`;

const OP_DIFFERENCE_ROUND = `
float opDifferenceRound(float a, float b, float r) {
  vec2 u = max(vec2(r + a, r - b), vec2(0.0));
  return min(-r, max(a, -b)) + length(u);
}`;

const OP_BLEND = `
float opBlend(float a, float b, float k) {
  return (1.0 - k) * a + k * b;
}`;

const OP_ELONGATE = `
vec3 opElongate(vec3 p, vec3 s) {
  vec3 q = abs(p) - s;
  return vec3(max(q, 0.0));
}`;

module.exports = {
  SD_SPHERE,
  SD_BOX,
  SD_TORUS,
  SD_HEX,
  SD_TRIANGLE,
  SD_CAPSULE,
  SD_CYLINDER,
  OP_ROTATE,
  OP_MIRROR,
  OP_REPEAT,
  OP_REPEAT_POLAR,
  OP_UNION,
  OP_UNION_ROUND,
  OP_INTERSECTION,
  OP_INTERSECTION_ROUND,
  OP_DIFFERENCE,
  OP_DIFFERENCE_ROUND,
  OP_BLEND,
  OP_ELONGATE
};
