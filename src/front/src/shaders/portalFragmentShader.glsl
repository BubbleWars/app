precision highp float;

uniform vec3 uColor; // Color of the point
uniform float uSize; // Size of the point

void main() {
    vec3 outlineColor = vec3(1.0, 1.0, 1.0); // White outline color
    float innerRadius = 0.5 - (uSize*0.5); // Inner radius of the point, adjusted by size
    float outerRadius = 0.5; // Outer radius of the point

    float distanceFromCenter = distance(gl_PointCoord, vec2(0.5));
    float edge1 = innerRadius + (outerRadius - innerRadius) * 0.5; // Halfway to smooth edge

    float alpha = smoothstep(outerRadius, edge1, distanceFromCenter); // Smooth the edge

    if (distanceFromCenter > outerRadius) {
        discard; // Outside of the point
    } else if (distanceFromCenter > innerRadius) {
        // On the outline, blend between outlineColor and uColor
        gl_FragColor = vec4(mix(outlineColor, uColor, alpha), 0.2);
    } else {
        // Inside the point
        gl_FragColor = vec4(uColor, 0.2);
    }
}
