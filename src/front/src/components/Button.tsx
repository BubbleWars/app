import React, { useState, useRef, useEffect } from 'react';
import { RoundedBox, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

export const Button = ({ onClick, label, position = [0, 0, 0], fontSize = 5 }) => {
    const [hovered, setHovered] = useState(false);
    const textRef = useRef();
    const [boxSize, setBoxSize] = useState([2, 1, 1]); // Starting with a reasonable default size

    useEffect(() => {
        const calculateBoxSize = () => {
            if (textRef.current && textRef.current.geometry) {
                textRef.current.geometry.computeBoundingBox();
                // Width calculation
                const textWidth = textRef.current.geometry.boundingBox.max.x - textRef.current.geometry.boundingBox.min.x;
                // Height calculation
                const textHeight = textRef.current.geometry.boundingBox.max.y - textRef.current.geometry.boundingBox.min.y;
                const padding = 6; // Padding to ensure the box wraps around the text comfortably
                setBoxSize([textWidth + padding, textHeight + padding, 0.1]); // Adjust depth as needed
            }
        };

        // Delay calculation to ensure text geometry is loaded, may need to adjust timeout
        const timeoutId = setTimeout(calculateBoxSize, 1000);

        return () => clearTimeout(timeoutId);
    }, [label, fontSize]);

    // Handle hover state
    const onPointerOver = () => setHovered(true);
    const onPointerOut = () => setHovered(false);

    // Scale animation on hover
    useFrame(() => {
        if (hovered) {
            // Grow effect
            textRef.current.scale.set(1.1, 1.1, 1.1);
            
        } else {
            // Reset effect
            textRef.current.scale.set(1, 1, 1);
        }
    });

    return (
        <group position={position} onPointerOver={onPointerOver} onPointerOut={onPointerOut} onClick={onClick}>
            <RoundedBox
                key={boxSize.toString()} // Use boxSize as key to force re-render
                args={boxSize} // Dynamically set based on text size
                radius={0.5}
                smoothness={4}
                bevelSegments={4}
                creaseAngle={0.4}
                position={[0, 0, -0.05]} // Adjust position slightly behind the text
            >
                <meshPhongMaterial color={hovered ? 'grey' : 'white'} />
            </RoundedBox>
            <Text
                ref={textRef}
                color={hovered ? 'white' : 'white'}
                fontSize={fontSize}
                font="fonts/PressStart2P-Regular.ttf"
                position={[0, 0, 0]}
            >
                {label}
            </Text>
        </group>
    );
};
