precision highp float;

uniform vec3 uColor; // Accessing the uniform color passed from React Three Fiber

varying float vDistance;

void main() {
  vec3 color = uColor; // Use the uniform color
    float alpha = 0.6; // Use the distance to the center to calculate the alpha value
    gl_FragColor = vec4(color, alpha);
  
}