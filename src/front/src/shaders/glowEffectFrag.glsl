varying vec2 vUv;
uniform vec3 uColor;
uniform float uTime;

void main() {
    vec2 center = vec2(0.5, 0.5);
    float distance = distance(vUv, center);
    float maxDistance = sqrt(2.0)/2.0;
    float intensity = pow(1.0 - distance/maxDistance, 4.0);

    // Create a pulsating effect
    float pulse = 0.75 + 0.25 * sin(uTime * 5.0); // Adjust the speed of the pulse by modifying the multiplier
    intensity *= pulse;

    // Ensure intensity is clamped to [0, 1] range
    intensity = clamp(intensity, 0.0, 1.0);

    vec3 color = uColor;

    // Apply the intensity to the alpha channel for transparency
    gl_FragColor = vec4(color, intensity);
}
