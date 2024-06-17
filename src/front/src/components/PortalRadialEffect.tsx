import vertSrc from '../shaders/portalRadialEffectVert.glsl?raw';
import fragSrc from '../shaders/portalRadialEffectFrag.glsl?raw';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const PortalRadialEffect = (props: { position: THREE.Vector3, radius: number, color: THREE.Color | string }) => {
    const { position, radius, color } = props;
    const { camera } = useThree()
    const zoom = camera.zoom

    const uniforms = useRef({
        uTime: { value: 0.0 },
        uRadius: { value: radius },
        uColor: { value: (new THREE.Color(color)).convertLinearToSRGB() },
        uZoom: { value: zoom },
    }).current;

    useEffect(() => {
        uniforms.uRadius.value = radius;
        uniforms.uColor.value = new THREE.Color(color).convertLinearToSRGB();
        uniforms.uZoom.value = zoom;
    }, [radius, color, zoom]);

    useFrame(() => {
        uniforms.uTime.value += 0.01;
    });

    return (
        <mesh position={position}>
            <circleGeometry args={[2, 70]} />
            <shaderMaterial
                uniforms={uniforms}
                vertexShader={vertSrc}
                fragmentShader={fragSrc}
                transparent
            />
        </mesh>
    );
}