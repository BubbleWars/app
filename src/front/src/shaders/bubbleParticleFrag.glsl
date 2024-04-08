precision highp float;

uniform vec3 uColor; // Accessing the uniform color passed from React Three Fiber

varying float vDistance;

void main() {
  vec3 color = uColor; // Use the uniform color
  //the lower vDistance is, the more transparent the pixel will be
    float alpha  = 0.1 - vDistance;
    if (alpha < 0.0) {
        discard;
    }
    gl_FragColor = vec4(color, alpha*0.2);
  
}