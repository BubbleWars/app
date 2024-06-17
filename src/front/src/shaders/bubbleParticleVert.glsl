uniform float uTime;
uniform float uRadius;
uniform float uZoom; // Uniform for camera zoom level
uniform vec2 uDirection; // Uniform for direction of rotation on the Z axis
uniform float uMagnitude; // Uniform for magnitude of the direction vector

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

  // Get length from the magnitude of the uMagnitude vector
  float length = abs(uMagnitude);
  
  // Apply rotation around the Y-axis
  vec3 particlePosition = position * rotation3dY(uTime * 0.3);

  
  // scale the particle position on the x-axis by the length
  particlePosition.x *= length * 3.0;
  //make sure no particle is less than 0 on the x-axis
  particlePosition.x = max(particlePosition.x, 0.0);
  //make sure no particle is greater than 1 on the x-axis
  particlePosition.x = min(particlePosition.x, 0.5);

  // scale down the particle position on the y-axis
  particlePosition.y *= 0.5;

  
  // Now, apply the rotation based on uDirection around the Z-axis
  particlePosition = particlePosition * rotation3dZ(angle);

  // Now translate by uRadius along uDirection
  //vec3 normalizedUDirection = normalize(uDirection);
  particlePosition -= vec3(uRadius * uDirection.x*0.9, uRadius * uDirection.y*0.9, 0.0);

  vDistance = particlePosition.z + 0.1;

  vec4 modelPosition = modelMatrix * vec4(particlePosition, 1.0);
  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectedPosition = projectionMatrix * viewPosition;

  gl_Position = projectedPosition;

  // Adjust point size based on the zoom level
  gl_PointSize = 0.2 * uRadius * uZoom; // Use a base size and adjust based on zoom level

  // Optionally, apply a further size attenuation factor here if necessary
  // gl_PointSize *= attenuationFactor;
}
