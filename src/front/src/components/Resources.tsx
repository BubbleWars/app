import { massToRadius } from "../../../core/funcs/utils";
import { useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { currentState, resources } from "../../../core/world";
import { Outlines } from "@react-three/drei";
import { darkenColor } from "../utils";
import { resourceStartPositions } from "./Game";
import { MathUtils } from "three";
import { CustomText } from "./CustomText";
import { LERP_SPEED } from "../consts";
import { CLASH_KE } from "../../../core/consts";
import { ResourceType } from "../../../core/types/resource";
import { ResourceTypeToName } from "./BubblesInfo";
import { resourceMassToAmount } from "../../../core/funcs/resource";
import { isResourceActivated } from "../../../core/funcs/bubble";
import { EffectGlow } from "./EffectGlow";

export const RESOURCE_TO_COLOR = {
    [ResourceType.ENERGY]: "#3ABEF9",
}

export const Resource = ({ resourceId }: { resourceId: string }) => {
    const meshRef = useRef<any>();
    const [textPosition, setTextPosition] = useState<THREE.Vector3>(
        new THREE.Vector3(0, 0, 0),
    );
    const [isHovered, setIsHovered] = useState<boolean>(false);
    const [isSelected, setIsSelected] = useState<boolean>(false);
    const [disableLerp, setDisableLerp] = useState<boolean>(false);
    const resource = currentState.resources.find(
        (resource) => resource.id === resourceId,
    ) ?? {id:"", position: {x: 0, y: 0}, mass: 0, velocity: {x: 0, y: 0}, type: ResourceType.ENERGY, owner: ""};
    const mass = resource?.mass.toFixed(2) ?? "0";
    const amount = resourceMassToAmount(resource?.type, resource?.mass ?? 0);
    const radius = massToRadius(parseInt(mass ?? "0"));
    const velocity = resource?.velocity
    const magnitude = Math.sqrt(velocity?.x ** 2 + velocity?.y ** 2)
    const kineticEnergy =
        velocity && resource
            ? magnitude * resource?.mass
            : 0;
   //console.log("kinetic energy", kineticEnergy);

    useFrame(() => {
        const resource = currentState.resources.find(
            (resource) => resource.id === resourceId,
        );
        if (!resource) {
            //console.log("resource not found", resourceId)
            meshRef.current.position.set(0, 0, 0);
            meshRef.current.updateMatrix();
            //setDisableLerp(true)
            return;
        }

        if (!meshRef.current) {
            //console.log("resource not found")
            meshRef.current.position.set(0, 0, 0);
            meshRef.current.updateMatrix();
            //setDisableLerp(true)
            return;
        }

        if (!meshRef.current.position.x || !meshRef.current.position.y) {
            const startPosition = resourceStartPositions[resourceId];
            //console.log("meshRef posision", meshRef.current.position)
            if (false) {
                meshRef.current.position.set(
                    startPosition.x,
                    startPosition.y,
                    0,
                );
            } else {
                //return
                //get node position
                const node = currentState.nodes.find(
                    (node) => node.id === resource.owner,
                );
                const bubble = currentState.bubbles.find(
                    (bubble) => bubble.id === resource.owner,
                );
                const portal = currentState.portals.find(
                    (portal) => portal.id === resource.owner,
                );

                const from = node ?? bubble ?? portal;
                if (from) {
                    meshRef.current.position.set(
                        from.position.x,
                        from.position.y,
                        0,
                    );
                } 
                meshRef.current.scale.set(0, 0, 0);

                //console.log("resource start position not found")
            }
            //console.log("resource not found")
        }
        const radius = massToRadius(resource.mass) + 0.1;
        const newRadius = MathUtils.lerp(meshRef.current.scale.x, radius, 0.1);
        meshRef.current.scale.set(newRadius, newRadius, newRadius);
        //console.log("resource position:", resource.position)
        const newX = MathUtils.lerp(
            meshRef.current.position.x,
            resource.position.x,
            LERP_SPEED,
        );
        const newY = MathUtils.lerp(
            meshRef.current.position.y,
            resource.position.y,
            LERP_SPEED,
        );
        setTextPosition(new THREE.Vector3(newX, newY, 0));
        meshRef.current.position.set(newX, newY, 0);
        meshRef.current.updateMatrix();
    });

    //blue in hex
    const baseColor = RESOURCE_TO_COLOR[resource.type]
    const outlineColor = darkenColor(baseColor, 0.5); // Darken by 20%

    console.log("velocity in resource", velocity.x, velocity.y)
    console.log("is resource activated", isResourceActivated(velocity.x, velocity.y))
    console.log("resource type", resource.type == ResourceType.ENERGY)

    return (
        <>
        <EffectGlow position={new THREE.Vector3(resource.position.x, resource.position.y, 0)} radius={radius+0.4} color={'#87CEEB'} />
            <CustomText
                position={new THREE.Vector3(radius + 0.3, radius + 0.4, 0).add(
                    textPosition,
                )}
                //position={textPosition}
                size={0.4}
                color={"white"}
                outlineColor={baseColor}
                
            >
                {amount.toFixed(2)} $BBL
            </CustomText>
            {isResourceActivated(velocity.x, velocity.y) && resource.type == ResourceType.ENERGY && (
                <CustomText
                    position={new THREE.Vector3(radius + 1, 0, 0).add(
                        textPosition,
                    )}
                    //position={textPosition}
                    size={radius * 0.5}
                    noOutline={true}
                    >
                        WILL HURT!
                    </CustomText>
            )}
            <mesh
                ref={meshRef}
                onPointerEnter={() => {
                    if (!isSelected) setIsHovered(true);
                }}
                onPointerLeave={() => setIsHovered(false)}
                onClick={() => {
                    setIsSelected(!isSelected);
                    setIsHovered(false);
                }}
                onContextMenu={() => setIsSelected(false)}
            >
                <sphereGeometry />
                <Outlines thickness={0.1} color={outlineColor} />
                <meshBasicMaterial
                    toneMapped={false}
                    color={isResourceActivated(velocity.x, velocity.y) ? "red" : baseColor}
                />
            </mesh>
        </>
    );
};

export const Resources = ({ resources }: { resources: string[] }) => {
    return resources.map((resource, index) => (
        <Resource key={resource} resourceId={resource} />
    ));
};
