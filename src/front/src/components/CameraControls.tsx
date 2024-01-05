import * as THREE from 'three';
import { extend, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { useRef } from 'react'

export class CustomControls extends OrbitControls {
    constructor(camera:any, domElement:any) {
      super(camera, domElement);
  
      // Swap the mouse buttons: left (orbit) becomes right, and right (pan) becomes left
      this.mouseButtons = { LEFT: THREE.MOUSE.RIGHT, RIGHT: THREE.MOUSE.RIGHT };
    }
  
    // Additional custom logic can be added here if needed
  }
  
  // Extend the @react-three/fiber controls with the custom controls
extend({ CustomControls });
  
export const CustomCameraControls = () => {
    const { camera, gl } = useThree();
    const controls = useRef();

    useFrame(() => controls.current?.update());

    return <customControls ref={controls} args={[camera, gl.domElement]} />;
}