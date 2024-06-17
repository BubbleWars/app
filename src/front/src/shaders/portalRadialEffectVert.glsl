varying vec2 vUv;
uniform float uRadius;

void main() {
    vUv = uv;
    // Scale the position by the uRadius
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position * uRadius, 1.0);
}
