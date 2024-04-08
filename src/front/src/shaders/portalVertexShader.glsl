uniform float uTime;
uniform float uRadius;
uniform float uZoom; // Uniform for camera zoom level

varying float vDistance;

// Source: https://github.com/dmnsgn/glsl-rotate/blob/main/rotation-3d-y.glsl.js
mat3 rotation3dY(float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return mat3(
    c, 0.0, -s,
    0.0, 1.0, 0.0,
    s, 0.0, c
  );
}

// Rotates a vector by a given angle around the Z axis
mat3 rotation3dZ(float angle) {
  float s = sin(angle);
  float c = cos(angle);

  return mat3(
    c, s, 0.0,
    -s, c, 0.0,
    0.0, 0.0, 1.0
  );
}


void main() {
  float distanceFactor = pow(uRadius - distance(position, vec3(0.0)), 1.5);
  float size = distanceFactor * 60.0 + 150.0;
  vec3 particlePosition = position * rotation3dZ(uTime * 0.09 * distanceFactor);

  vDistance = distanceFactor;

  vec4 modelPosition = modelMatrix * vec4(particlePosition, 1.0);
  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectedPosition = projectionMatrix * viewPosition;

  gl_Position = projectedPosition;

 // Adjust point size based on the zoom level
  gl_PointSize = 1.0 * uZoom; // Divide size by zoom to counteract the scaling effect of zooming

  // Optionally, apply a further size attenuation factor here if necessary
  // gl_PointSize *= attenuationFactor;
}