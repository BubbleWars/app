varying vec2 vUv;
uniform float uRadius;

void main() {
    // Calculate the distance from the center
    float dist = length(vUv - vec2(0.5, 0.5)) * 2.0;

    // Calculate the alpha with a fade effect at the edges
    float fade = smoothstep(uRadius - 0.5, uRadius, dist) - smoothstep(uRadius, uRadius + 0.5, dist);
    float alpha = fade * (1.0 - smoothstep(0.9, 1.0, dist)); // Add a slight fade at the outer edge

    // Set the shield color to blue with the calculated alpha
    vec3 color = vec3(58.0, 190.0, 249.0);

    gl_FragColor = vec4(color, alpha);
}
