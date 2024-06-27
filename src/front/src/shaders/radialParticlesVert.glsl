attribute float aAngle;
attribute float aDistance;
varying float vDistance;

uniform float uZoom;
uniform float uTime;
uniform float uRadius;

void main() {
    // Calculate the new distance based on time
    float speed = 0.1; // Adjust speed as needed
    float newDistance = mod(aDistance - uTime * speed, 1.0);

    // Convert polar coordinates to Cartesian coordinates
    vec3 pos = vec3(
        cos(aAngle) * newDistance,
        sin(aAngle) * newDistance,
        0.0
    );

    vDistance = newDistance;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos * uRadius, 1.0);
    gl_PointSize = 0.1 * uZoom;
}
