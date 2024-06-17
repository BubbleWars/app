
import { useEffect, useRef, useState } from "react";
import ShadowMesh from "./Shadow";
import { useFrame } from "@react-three/fiber";
import { currentState } from "../../../core/world";
import { MathUtils, Shape } from "three";
import { CircleState, ObstacleState, PolygonState } from "../../../core/types/state";
import { LERP_SPEED } from "@/consts";
import { getColorFromPalette } from "../../../core/funcs/utils";
import * as THREE from "three";
import { Edges, Outlines } from "@react-three/drei";
import { darkenColor } from "@/utils";


export const getShapeFromObstacle = (obstacle: ObstacleState): Shape => {
    const type = obstacle.shape.type;
    const shape = new THREE.Shape();
    console.log("obstacle", obstacle);
    switch (type) {
        case "circle":
            const circle = obstacle.shape as CircleState;
            shape.absarc(0, 0, circle.radius, 0, Math.PI * 2, false);
            break;
        case "polygon":
            const polygon = obstacle.shape as PolygonState;
            const vertices = polygon.vertices;
            vertices.forEach((vertex, index) => {
                if(index === 0) shape.moveTo(vertex.x, vertex.y);
                else shape.lineTo(vertex.x, vertex.y);
            });
            break;
    
        default:
            break;
    }
    console.log("shape", shape);
    return shape;
}

export const Obstacle = ({ obstacleId }: { obstacleId: string }) => {
    const meshRef = useRef<any>();
    const [shape, setShape] = useState<Shape | null>(new THREE.Shape());
    const color = getColorFromPalette(parseInt(obstacleId), 420);
    const outlineColor = darkenColor(color, 0.95); // Darken by 20%

    useEffect(() => {
        const obstacle = currentState.obstacles.obstaclesStates.find((obstacle) => obstacle.id )
        setShape(getShapeFromObstacle(obstacle));
    }, [obstacleId]);

    useFrame(() => {
        const obstacle = currentState.obstacles.obstaclesStates.find((obstacle) => obstacle.id === obstacleId);
        if (!obstacle) return;
        const lastX = meshRef.current.position.x;
        const lastY = meshRef.current.position.y;
        const lastAngle = meshRef.current.rotation.z;
        const newX = MathUtils.lerp(lastX, obstacle.position.x, LERP_SPEED);
        const newY = MathUtils.lerp(lastY, obstacle.position.y, LERP_SPEED);
        const newAngle = MathUtils.lerp(lastAngle, obstacle.angle, LERP_SPEED);
        meshRef.current.position.set(newX, newY, 0);
        meshRef.current.rotation.set(0, 0, newAngle);
    })

    return (
        <ShadowMesh
            originalMesh={
                <mesh ref={meshRef}>
                    <shapeGeometry args={[shape]} />
                    <Edges color={outlineColor} />
                    <meshBasicMaterial color={color} />
                </mesh>        
            }
            originalRef={meshRef}
        />
    );
};

export const Obstacles = ({ obstacles }: { obstacles: string[] }) => {
    return obstacles.map((node, index) => <Obstacle key={index} obstacleId={node} />);
};
