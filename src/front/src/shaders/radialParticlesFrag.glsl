varying float vDistance;
uniform vec3 uColor;

void main() {
    // Calculate intensity based on distance
    float intensity = 1.0 - vDistance;
    intensity = clamp(intensity, 0.0, 1.0);

    vec3 color = uColor;

    // Apply the intensity to the alpha channel for transparency
    gl_FragColor = vec4(color, intensity*2.0); // Squared for a smoother falloff
}
