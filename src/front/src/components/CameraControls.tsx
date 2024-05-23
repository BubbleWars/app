import * as THREE from "three";
import { extend, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CameraControls } from "@react-three/drei";
import { is } from "@react-three/fiber/dist/declarations/src/core/utils";
import { setPan } from "../store/interpolation";
import { currentState } from "../../../core/world";
import { useIsAiming } from "@/hooks/state";

// export class CustomControls extends OrbitControls {
//     constructor(camera: any, domElement: any) {
//         super(camera, domElement);

//         // Swap the mouse buttons: left (orbit) becomes right, and right (pan) becomes left
//         this.mouseButtons = {
//             LEFT: THREE.MOUSE.RIGHT,
//             RIGHT: undefined,
//         };
//         this.enableRotate = false;
//         this.rotateSpeed = 0;
//     }

//     setEnableZoom(enable: boolean) {
//         this.enableZoom = enable;
//     }

//     setEnableRotate(enable: boolean) {
//         this.enableRotate = enable;
//     }

//     setEnablePan(enable: boolean) {
//         this.enablePan = enable;
//     }
    

//     // Additional custom logic can be added here if needed
// }

// // Extend the @react-three/fiber controls with the custom controls
// extend({ CustomControls });

export const CustomCameraControls = () => {
    const { camera, gl } = useThree();
    const controls = useRef<CameraControls>();
    const isBubbleSelected = useSelector(
        (state: any) => state.interpolation.isBubbleSelected,
    );
    const isAiming = useIsAiming();

    const pan = useSelector((state: any) => state.interpolation.pan);
    const lock = useSelector((state: any) => state.interpolation.lock);
    const controlsActive = useSelector((state: any) => state.interpolation.controlsActive);
    const dispatch = useDispatch();
    

    useEffect(() => {
        if (pan) {
            controls.current.moveTo(pan.x, pan.y, camera.position.z, true);
        }
    }, [pan]);

    useEffect(() => {
        if (controls.current) {
            controls.current.minZoom = 30;
        }
    }, [controls]);

    useFrame(() => {
        // if (controlsActive) {
        //     if (lock) {
        //         const bubble = currentState.bubbles.find(
        //             (bubble) => bubble.id == lock,
        //         );
        //         if (bubble) {
        //             const x = THREE.MathUtils.lerp(
        //                 camera.position.x,
        //                 bubble.position.x,
        //                 0.1,
        //             );
        //             const y = THREE.MathUtils.lerp(
        //                 camera.position.y,
        //                 bubble.position.y,
        //                 0.1,
        //             );
        //             camera.position.x = x;
        //             camera.position.y = y;
                    
        //         }
        //         //controls.current?.setEnablePan(false);

        //     }
        //     //controls.current?.setEnableZoom(false);

        // } else if (lock) {
        //     const bubble = currentState.bubbles.find(
        //         (bubble) => bubble.id == lock,
        //     );
        //     if (bubble) {
        //         const x = THREE.MathUtils.lerp(
        //             camera.position.x,
        //             bubble.position.x,
        //             0.05,
        //         );
        //         const y = THREE.MathUtils.lerp(
        //             camera.position.y,
        //             bubble.position.y,
        //             0.05,
        //         );
        //         camera.position.x = x;
        //         camera.position.y = y;
        //     }
        //     // controls.current?.setEnableZoom(false);
        //     // controls.current?.setEnablePan(false);
        // } else {
        //     // controls.current?.setEnablePan(true);
        //     // controls.current?.setEnableZoom(true);

        //     // //set rotation to 0
        //     // camera.rotation.x = 0;
        //     // camera.rotation.y = 0;
        //     // camera.rotation.z = 0;
        // }
        //controls.current?.setEnableRotate(false);
    });

    //if(isBubbleSelected) return null
    //if (lock) return null;

    return <CameraControls 
        ref={controls} 
        //args={[camera, gl.domElement]} 
        onEnd={() => {
            window.dispatchEvent(new Event("resize"));
        }}
        mouseButtons={{
            left: 4, // 4 is offset
            middle: 0, // 0 is none
            right: 0, // 0 is none
            wheel: controlsActive || isAiming ? 0 : 16,
        }}
    />;
};
