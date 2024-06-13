precision highp float;

uniform vec3 uColor; // Accessing the uniform color passed from React Three Fiber

varying float vDistance;

void main() {
  vec3 color = uColor; // Use the uniform color
  //the lower vDistance is, the more transparent the pixel will be
    float alpha  = 0.1 - vDistance;
    float distanceFromCenter = distance(gl_PointCoord, vec2(0.5));
    if (alpha < 0.0 || distanceFromCenter > 0.5) {
        discard;
    }
    gl_FragColor = vec4(color, alpha);
  
}

// precision highp float;

// uniform vec3 uColor; // Accessing the uniform color passed from React Three Fiber

// void main() {
//   vec3 color = uColor; // Use the uniform color

//   // Calculate the distance from the center of the point to create a circular effect
//   float distanceFromCenter = distance(gl_PointCoord, vec2(0.5));
//   float alpha = 1.0 - smoothstep(0.0, 0.5, distanceFromCenter);

//   if (alpha < 0.1) {
//     discard;
//   }

//   gl_FragColor = vec4(color, alpha * 0.2);
// }
