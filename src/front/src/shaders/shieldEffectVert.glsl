varying vec2 vUv;
uniform float uTime;
uniform float uRadius;

void main() {
    vUv = uv;
    // Animate size using sine function and scale by uRadius
    float scale = uRadius * (1.0 + 0.1 * sin(uTime));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position * scale, 1.0);
}
