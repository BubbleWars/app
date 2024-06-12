precision highp float;

uniform vec3 uColor; // Accessing the uniform color passed from React Three Fiber
uniform float uSize; // Size of the point

varying float vDistance;

void main() {
  vec3 color = uColor; // Use the uniform color
  //the lower vDistance is, the more transparent the pixel will be
    float alpha  = 0.1 - vDistance;
    // if (alpha < 0.0) {
    //     discard;
    // }
    //gl_FragColor = vec4(color, alpha*0.2);

    vec3 outlineColor = vec3(1.0, 1.0, 1.0); // White outline color
    float innerRadius = 0.5 - (1*0.5); // Inner radius of the point, adjusted by size
    float outerRadius = 0.5; // Outer radius of the point

    float distanceFromCenter = distance(gl_PointCoord, vec2(0.5));
    float edge1 = innerRadius + (outerRadius - innerRadius) * 0.5; // Halfway to smooth edge

    float alpha = smoothstep(outerRadius, edge1, distanceFromCenter); // Smooth the edge

    if (distanceFromCenter > outerRadius) {
        discard; // Outside of the point
    } else if (distanceFromCenter > innerRadius) {
        // On the outline, blend between outlineColor and uColor
        gl_FragColor = vec4(mix(outlineColor, uColor, alpha), 0.9);
    } else {
        // Inside the point
        gl_FragColor = vec4(uColor, 0.9);
    }
  
}