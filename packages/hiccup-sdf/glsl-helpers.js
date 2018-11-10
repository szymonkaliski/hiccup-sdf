const createShaderModel = (sdfFragment, sdfLibrary) => `
${sdfLibrary}

vec2 doModel(vec3 p) {
  return vec2(${sdfFragment}, 0.0);
}
`;

const createShaderFull = (sdfFragment, sdfLibrary) => `
precision mediump float;

const int SDF_STEPS = 50;

uniform float width;
uniform float height;

uniform float camTheta;
uniform float camPhi;
uniform float camDistance;

${createShaderModel(sdfFragment, sdfLibrary)}

vec2 calcRayIntersection(vec3 rayOrigin, vec3 rayDirection, float maxDistance, float prec) {
  float latest = prec * 2.0;
  float dist   = +0.0;
  float type   = -1.0;
  vec2  res    = vec2(-1.0, -1.0);

  for (int i = 0; i < SDF_STEPS; i++) {
    if (latest < prec || dist > maxDistance) {
      break;
    }

    vec2 result = doModel(rayOrigin + rayDirection * dist);

    latest = result.x;
    type   = result.y;
    dist  += latest;
  }

  if (dist < maxDistance) {
    res = vec2(dist, type);
  }

  return res;
}

vec2 raytrace(vec3 rayOrigin, vec3 rayDirection) {
  return calcRayIntersection(rayOrigin, rayDirection, 100.0, 0.0001);
}

vec3 calcNormal(vec3 pos, float eps) {
  const vec3 v1 = vec3( 1.0, -1.0, -1.0);
  const vec3 v2 = vec3(-1.0, -1.0,  1.0);
  const vec3 v3 = vec3(-1.0,  1.0, -1.0);
  const vec3 v4 = vec3( 1.0,  1.0,  1.0);

  return normalize(
    v1 * doModel(pos + v1 * eps).x +
    v2 * doModel(pos + v2 * eps).x +
    v3 * doModel(pos + v3 * eps).x +
    v4 * doModel(pos + v4 * eps).x
  );
}

vec3 normal(vec3 pos) {
  return calcNormal(pos, 0.001);
}

mat3 calcLookAtMatrix(vec3 origin, vec3 target, float roll) {
  vec3 rr = vec3(sin(roll), cos(roll), 0.0);
  vec3 ww = normalize(target - origin);
  vec3 uu = normalize(cross(ww, rr));
  vec3 vv = normalize(cross(uu, ww));

  return mat3(uu, vv, ww);
}

vec3 getRay(mat3 camMat, vec2 screenPos, float lensLength) {
  return normalize(camMat * vec3(screenPos, lensLength));
}

vec3 getRay(vec3 origin, vec3 target, vec2 screenPos, float lensLength) {
  mat3 camMat = calcLookAtMatrix(origin, target, 0.0);
  return getRay(camMat, screenPos, lensLength);
}

vec2 square(vec2 screenSize) {
  vec2 position = 2.0 * (gl_FragCoord.xy / screenSize.xy) - 1.0;
  position.x *= screenSize.x / screenSize.y;
  return position;
}

void orbitCamera(out vec3 rayOrigin, out vec3 rayDirection) {
  float PI = 3.14159265359;

  vec2 screenPos = square(vec2(width, height));
  vec3 rayTarget = vec3(0.0);

  rayOrigin = vec3(
    camDistance * sin(camTheta * PI / 360.0) * cos(camPhi * PI / 360.0),
    camDistance * sin(camPhi * PI / 360.0),
    camDistance * cos(camTheta * PI / 360.0) * cos(camPhi * PI / 360.0)
  );

  rayDirection = getRay(rayOrigin, rayTarget, screenPos, 2.0);
}

vec3 lighting(vec3 pos, vec3 nor, vec3 rayOrigin, vec3 rayDirection) {
  vec3 dir = normalize(vec3(-10.0, 10.0, 10.0));
  vec3 col = vec3(1.0);
  vec3 dif = col * max(0.05, dot(dir, nor));

  vec3 ambient = vec3(0.1);

  return dif + ambient;
}

void main () {
  vec3 color = vec3(0.2);
  vec3 rayOrigin, rayDirection;

  orbitCamera(rayOrigin, rayDirection);

  vec2 t = raytrace(rayOrigin, rayDirection);

  if (t.x > -0.5) {
    vec3 pos = rayOrigin + rayDirection * t.x;
    vec3 nor = normal(pos);

    color = lighting(pos, nor, rayOrigin, rayDirection);
  }

  gl_FragColor = vec4(color, 1.0);
}
`;

module.exports = {
  createShader: createShaderFull,
  createShaderFull,
  createShaderModel
};
