import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import vertSrc from '../shaders/shieldEffectVert.glsl?raw';
import fragSrc from '../shaders/shieldEffectFrag.glsl?raw';

const SHIELD_THICKNESS = 0.5;
const SHIELD_MARGIN = 0.1;

export const EffectShield = (props: { position: THREE.Vector3, radius: number }) => {
    const { position, radius } = props;
    const { camera } = useThree()
    const zoom = camera.zoom

    const uniforms = useRef({
        uTime: { value: 0.0 },
        uRadius: { value: radius + SHIELD_MARGIN + SHIELD_THICKNESS },
        uZoom: { value: zoom },
    }).current;

    useEffect(() => {
        uniforms.uRadius.value = radius + SHIELD_MARGIN + SHIELD_THICKNESS;
        uniforms.uZoom.value = zoom;
    }, [radius, zoom]);

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
};
