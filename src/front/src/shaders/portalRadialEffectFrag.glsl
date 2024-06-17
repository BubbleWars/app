varying vec2 vUv;
uniform vec3 uColor;
uniform float uTime;

void main() {
    vec2 center = vec2(0.5, 0.5);
    float distance = distance(vUv, center);
    float intensity = pow(1.0 - distance, 4.0); // Raise to a higher power to increase the falloff rate
    // Increase the frequency of the circles for better resolution
    float circles = sin((distance * 100.0) + (uTime * 10.0)) * 0.5 + 0.5; // Frequency increased to 100
    //Increase the thickness based on the intensity
    bool shouldDraw = circles > 0.5;

    // Use the original color with dynamic alpha for visibility
    vec3 color = uColor;
    float alpha = shouldDraw ? intensity : 0.0;

    gl_FragColor = vec4(color, alpha);
}
