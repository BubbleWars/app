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
import { BubbleState } from "../../../core/types/state";
import { useFrame } from "@react-three/fiber";
import { RESOURCE_TO_COLOR } from "./Resources";

export const ResourceTypeToName = {
    [ResourceType.BUBBLE]: "ETH",
    [ResourceType.ENERGY]: "blue",
};


export const ResourceButton = ({
    id,
    type,
    position,
    size,
    amount,
    isPortal = false,
} : {
    id: string,
    type: ResourceType,
    position: THREE.Vector3,
    size: number,
    amount: number,
    isPortal: boolean
}) => {
    const dispatch = useDispatch();
    const colorName = RESOURCE_TO_COLOR[type];
    const [text, setText] = useState<string>(amount.toFixed(2));
    const [isHovered, setIsHovered] = useState<boolean>(false);
    const mass = Math.max(amount/10, 1); // 10% of the resource but at least 1

    useFrame(() => {
        if(isHovered) setText("Emit");
        else setText(amount.toFixed(2));
    })

    return (
        <group
            position={position}
            onPointerEnter={() => setIsHovered(true)}
            onPointerLeave={() => setIsHovered(false)}
            onClick={() => dispatch(setAiming({ id, type, mass, isPortal}))}
        >
            <CustomText
                size={size*1.5}
                color={"white"}
                outlineColor={colorName}
            >
                {text} $BBL
            </CustomText>
        </group>
        
    )
}

export const Inventory = ({
    id,
    radius,
    position,
    resources,
    isPortal = false,
}: {
    id: string,
    radius: number,
    position: THREE.Vector3,
    resources: { resource: ResourceType; mass: number }[] | null
    isPortal: boolean
}) => {
    //3 degrees
    const pos = position.clone()
    const angleDelta = 15 * Math.PI / 180;
    const dir = new THREE.Vector3(-1,0,0).multiplyScalar(radius*1.7);
    const energyPos = pos.clone().add(dir.clone())

    const energyAmount = resources?.find((resource) => resource.resource == ResourceType.ENERGY)?.mass ?? 0;
 

    return (
        <>
            <ResourceButton
                id={id}
                type={ResourceType.ENERGY}
                position={energyPos}
                size={radius / 7}
                isPortal={isPortal}
                amount={energyAmount}
            />

        </>
    )
}

export const BubblesInfo = ({bubble, position}: {bubble: BubbleState, position: THREE.Vector3}) => {
    const userSocial = useUserSocial({ address: bubble?.owner });
    const social = userSocial?.social ?? null;

    if (!bubble) return null;

    const displayName = social ?? truncateAddress(bubble.owner);
    const radius = massToRadius(bubble.mass);
    const pos = position.clone();
    const mass = bubble?.mass;

    const lineHeightVector = new THREE.Vector3(0, -radius / 3, 0);
    const pos2 = pos
        .clone()
        .add(lineHeightVector.clone().multiplyScalar(1))
        .clone();
    

    return (
        <>
            <CustomText 
                size={radius / 8} 
                position={pos2} 
            >
                @{displayName}
            </CustomText>
            <CustomText
                size={radius / 3}
                position={pos}
            >
                {(mass).toFixed(2)} ETH
            </CustomText>

            <Inventory 
                key={bubble.id}
                id={bubble.id} 
                radius={radius} 
                position={pos} 
                resources={bubble?.resources} 
            />

        </>
    );
};
