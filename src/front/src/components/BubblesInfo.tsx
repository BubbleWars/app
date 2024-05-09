import { Text, Text3D } from "@react-three/drei";
import { currentState } from "../../../core/world";
import { massToRadius, truncateAddress } from "../../../core/funcs/utils";
import * as THREE from "three";
import { CustomText } from "./CustomText";
import { ResourceType } from "../../../core/types/resource";
import { useDispatch, useSelector } from "react-redux";
import { setLock } from "../store/interpolation";
import { useDisplayName } from "./GetDisplayName";
import { useUserSocial } from "@/hooks/socials";
import { useState } from "react";
import { setAiming } from "@/store/controls";

export const ResourceTypeToName = {
    [ResourceType.BUBBLE]: "ETH",
    [ResourceType.BLUE]: "blue",
    [ResourceType.RED]: "red",
    [ResourceType.GREEN]: "green",
    [ResourceType.VIOLET]: "violet",
};


export const ResourceButton = ({
    id,
    type,
    position,
    size,
    amount,
} : {
    id: string,
    type: ResourceType,
    position: THREE.Vector3,
    size: number,
    amount: number,
}) => {
    const dispatch = useDispatch();
    const colorName = ResourceTypeToName[type];
    const [text, setText] = useState<string>(amount.toFixed(2));
    const mass = Math.max(amount/10, 1); // 10% of the resource but at least 1
    return (
        <group
            position={position}
            onPointerEnter={() => setText("Emit " + colorName)}
            onPointerLeave={() => setText(amount.toFixed(2))}
            onClick={() => dispatch(setAiming({ id, type, mass}))}
        >
            <CustomText
                color={colorName}
                size={size}
            >
                {text}
            </CustomText>
        </group>
        
    )
}




export const Inventory = ({
    bubbleId,
    radius,
    position,
    resources
}: {
    bubbleId: string,
    radius: number,
    position: THREE.Vector3,
    resources: { resource: ResourceType; mass: number }[] | null
}) => {
    //3 degrees
    const pos = position.clone()
    const angleDelta = 15 * Math.PI / 180;
    const dir = new THREE.Vector3(-1,0,0).multiplyScalar(radius*1.3);
    const redPos = pos.clone().add(dir.clone())
    const greenPos = pos.clone().add(dir.clone().applyAxisAngle(new THREE.Vector3(0,0,1), angleDelta))
    const bluePos = pos.clone().add(dir.clone().applyAxisAngle(new THREE.Vector3(0,0,1), angleDelta * 2))
    const violet = pos.clone().add(dir.clone().applyAxisAngle(new THREE.Vector3(0,0,1), angleDelta * 3))

    const redAmount = resources?.find((resource) => resource.resource == ResourceType.RED)?.mass ?? 0;
    const greenAmount = resources?.find((resource) => resource.resource == ResourceType.GREEN)?.mass ?? 0;
    const blueAmount = resources?.find((resource) => resource.resource == ResourceType.BLUE)?.mass ?? 0;
    const violetAmount = resources?.find((resource) => resource.resource == ResourceType.VIOLET)?.mass ?? 0;
    

    return (
        <>
            <ResourceButton
                id={bubbleId}
                type={ResourceType.RED}
                position={redPos}
                size={radius / 7}
                amount={redAmount}
            />

            <ResourceButton
                id={bubbleId}
                type={ResourceType.GREEN}
                position={greenPos}
                size={radius / 7}
                amount={greenAmount}
            />

            <ResourceButton
                id={bubbleId}
                type={ResourceType.BLUE}
                position={bluePos}
                size={radius / 7}
                amount={blueAmount}
            />

            <ResourceButton
                id={bubbleId}
                type={ResourceType.VIOLET}
                position={violet}
                size={radius / 7}
                amount={violetAmount}
            />
        </>
    )
}

export const BubblesInfo = ({
    bubbleId,
    position,
}: {
    bubbleId: string | null;
    position: THREE.Vector3;
}) => {
    const dispatch = useDispatch();
    const lock = useSelector((state: any) => state.interpolation.lock);
    const bubble = currentState.bubbles.find(
        (bubble) => bubble.id === bubbleId,
    ) ?? { position: { x: 0, y: 0 }, mass: 0, owner: "", velocity: { x: 0, y: 0 } };
    const userSocial = useUserSocial({ address: bubble.owner });
    const social = userSocial?.social ?? null;

    if (!bubble) return null;
    if (!position) return null;

    const displayName = social ?? truncateAddress(bubble.owner);
    const radius = massToRadius(bubble.mass);
    const textPosition = position;

    const zeroPosition = new THREE.Vector3(0, 0, 0);
    const lineHeightVector = new THREE.Vector3(0, -radius / 3, 0);
    const pos2 = textPosition
        .clone()
        .add(lineHeightVector.clone().multiplyScalar(1))
        .clone();
    const pos3 = textPosition
        .clone()
        .add(new THREE.Vector3(radius, -radius, 0))
        .clone();
    const energy = bubble?.resources ? bubble?.resources?.find(
        (resource) => resource.resource == ResourceType.Energy,
    ): null;
    const energyAmount = energy ? energy.mass : 0;

    //console.log("resources main", bubble.resources)
    return (
        <>
            {/*  */}
            <group position={pos2}>
                
                {/* <CustomText
                    size={radius / 8}
                    color="blue"
                    position={new THREE.Vector3(radius / 7, 0, 0)}
                    anchorX="left"
                >
                    {energyAmount.toFixed(2)} EP
                </CustomText> */}
                <CustomText 
                    size={radius / 8} 
                    position={new THREE.Vector3(0, 0, 0)}
                    
                >
                    @{displayName}
                </CustomText>
            </group>
            <CustomText
                    size={radius / 3}
                    position={textPosition}
                    //anchorX="right"
                >
                    {(bubble.mass - energyAmount).toFixed(2)} ETH
                </CustomText>

            {/* <group
                position={pos3}
                onClick={() => {
                    if (lock == bubbleId) dispatch(setLock(null));
                    else dispatch(setLock(bubbleId));
                }}
            >
                <CustomText
                    size={radius / 3}
                    color="black"
                    position={zeroPosition}
                    anchorX="center"
                    noOutline={true}
                >
                    {lock == bubbleId ? "X" : "🔓"}
                </CustomText>
            </group> */}
                        <Inventory bubbleId={bubbleId} radius={radius} position={position} resources={bubble?.resources} />

        </>
    );
};
