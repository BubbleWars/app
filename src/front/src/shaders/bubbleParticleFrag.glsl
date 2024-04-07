precision highp float;

uniform vec3 uColor; // Accessing the uniform color passed from React Three Fiber

varying float vDistance;

void main() {
  vec3 color = uColor; // Use the uniform color
  //the lower vDistance is, the more transparent the pixel will be
    float alpha  = 1.0 - vDistance;
    gl_FragColor = vec4(color, alpha);
  
}