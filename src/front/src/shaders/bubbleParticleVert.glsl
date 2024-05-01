uniform float uTime;
uniform float uRadius;
uniform float uZoom; // Uniform for camera zoom level
uniform vec2 uDirection; // Uniform for direction of rotation on the Z axis

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
  // Calculate the angle from the uDirection vector
  float angle = atan(uDirection.y, -uDirection.x);
  
  // Apply rotation around the Y-axis
  vec3 particlePosition = position * rotation3dY(uTime * 0.3);
  
  // Now, apply the rotation based on uDirection around the Z-axis
  particlePosition = particlePosition * rotation3dZ(angle);

  // Now translate by uRadius along uDirection
  //vec3 normalizedUDirection = normalize(uDirection);
  particlePosition -= vec3(uRadius * uDirection.x*2.0, uRadius * uDirection.y*2.0, 0.0);

  vDistance = particlePosition.z + 0.1;

  vec4 modelPosition = modelMatrix * vec4(particlePosition, 1.0);
  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectedPosition = projectionMatrix * viewPosition;

  gl_Position = projectedPosition;

  // Adjust point size based on the zoom level
  gl_PointSize = 0.3 * uRadius * uZoom; // Use a base size and adjust based on zoom level

  // Optionally, apply a further size attenuation factor here if necessary
  // gl_PointSize *= attenuationFactor;
}
