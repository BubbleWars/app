import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import vertSrc from '../shaders/radialParticlesVert.glsl?raw';
import fragSrc from '../shaders/radialParticlesFrag.glsl?raw';

export const EffectRadialParticles = (props: { position: THREE.Vector3, radius: number, color: THREE.Color | string }) => {
    const { position, radius, color } = props;
    const { gl, camera } = useThree();
    const zoom = camera.zoom;
    const particleCount = 100;

    const [angleArray, setAngleArray] = useState(new Float32Array(particleCount));
    const [distanceArray, setDistanceArray] = useState(new Float32Array(particleCount));
    const [positions, setPositions] = useState(new Float32Array(particleCount * 3));

    useEffect(() => {
        const tempAngleArray = new Float32Array(particleCount);
        const tempDistanceArray = new Float32Array(particleCount);
        const tempPositions = new Float32Array(particleCount * 3);
        // Create particles with random angles and distances
        for (let i = 0; i < particleCount; i++) {
            tempAngleArray[i] = Math.random() * 2 * Math.PI;
            tempDistanceArray[i] = Math.random();
            tempPositions[i * 3] = Math.cos(angleArray[i]) * tempDistanceArray[i];
            tempPositions[i * 3 + 1] = Math.sin(tempAngleArray[i]) * tempDistanceArray[i];
            tempPositions[i * 3 + 2] = 0;
        }
        setAngleArray(tempAngleArray);
        setDistanceArray(tempDistanceArray);
        setPositions(tempPositions);
    }, []);

    const geometryRef = useRef<THREE.BufferGeometry>(null);
    const uniforms = useRef({
        uTime: { value: 0.0 },
        uColor: { value: new THREE.Color(color) },
        uZoom: { value: zoom },
        uRadius: { value: radius },
    }).current;

    useEffect(() => {
        uniforms.uColor.value = new THREE.Color(color).convertLinearToSRGB();
        uniforms.uZoom.value = zoom;
        uniforms.uRadius.value = radius;
        if (geometryRef.current) {
            geometryRef.current.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometryRef.current.setAttribute('aAngle', new THREE.BufferAttribute(angleArray, 1));
            geometryRef.current.setAttribute('aDistance', new THREE.BufferAttribute(distanceArray, 1));
        }

    }, [color, gl, positions, angleArray, distanceArray, radius, zoom]);

    useFrame(() => {
        uniforms.uTime.value += 0.1;
    });

    return (
        <points position={position}>
            <bufferGeometry ref={geometryRef} />
            <shaderMaterial
                uniforms={uniforms}
                vertexShader={vertSrc}
                fragmentShader={fragSrc}
                transparent
            />
        </points>
    );
};
