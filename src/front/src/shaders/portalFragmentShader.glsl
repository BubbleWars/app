precision highp float;

uniform vec3 uColor; // Accessing the uniform color passed from React Three Fiber

varying float vDistance;

void main() {
  vec3 color = uColor; // Use the uniform color
  vec3 outlineColor = vec3(0.0, 0.0, 0.0); // Color for the outline, white in this case
  float radius = 0.5; // Radius for the circular effect
  float outlineThickness = 0.2; // Thickness of the outline

  float distanceFromCenter = distance(gl_PointCoord, vec2(0.5));
  float alpha = 1.0;

  if (distanceFromCenter > radius) {
    // Make fragments outside the circle completely transparent
    discard;
  } else if (distanceFromCenter > (radius - outlineThickness)) {
    // Apply the outline color for fragments within the outline thickness
    gl_FragColor = vec4(outlineColor, alpha);
    //gl_FragColor = vec4(color, alpha);
  } else {
    // Inside the circle, use the passed uniform color
    gl_FragColor = vec4(color, alpha);
  }
}