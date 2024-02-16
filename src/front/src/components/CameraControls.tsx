import * as THREE from 'three';
import { extend, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { useRef } from 'react'
import { useSelector } from 'react-redux';
import { CameraControls } from '@react-three/drei';
import { is } from '@react-three/fiber/dist/declarations/src/core/utils';

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
    const controls = useRef<CameraControls>();
    const isBubbleSelected = useSelector((state: any) => state.interpolation.isBubbleSelected)

    useFrame(() => {
      if(isBubbleSelected) {
       //console.log("isBubbleSelected")
        //controls.current?.enabled = false
      }else{
        controls.current?.update()
        //set rotation to 0
        camera.rotation.x = 0
        camera.rotation.y = 0
        camera.rotation.z = 0
      }
    });

    if(isBubbleSelected) return null

    return <customControls ref={controls} args={[camera, gl.domElement]} />;
}