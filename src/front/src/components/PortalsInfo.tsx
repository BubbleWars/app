import { Text3D } from "@react-three/drei";
import { currentState } from "../../../core/world";
import { massToRadius, truncateAddress } from "../../../core/funcs/utils";
import * as THREE from "three";
import { CustomText } from "./CustomText";
import { ResourceType } from "../../../core/types/resource";
import { C } from "../../../core/consts";
import { useDisplayName } from "./GetDisplayName";
import { useUserSocial } from "@/hooks/socials";

export const PortalsInfo = ({ portalId }: { portalId: string }) => {
    const portal = currentState.portals.find(
        (portal) => portal.id === portalId,
        ) ?? { position: { x: 0, y: 0 }, mass: 0, owner: "", velocity: { x: 0, y: 0 }, resources: [], id: "" };
        //    const currentUserSocials = useUserSocial({ address: portal.owner });
    //console.log("wasteyute", currentUserSocials);
    const userSocial = useUserSocial({ address: portal.owner });
    const social = userSocial?.social ?? "not found"
    console.log("flamingo ", social);

    if (!portal) return null;
    const displayName = social ?? portal.owner;
    const radius = massToRadius(portal.mass);
    const textPosition = new THREE.Vector3(
        portal.position.x,
        portal.position.y,
        0,
    );
    const lineHeightVector = new THREE.Vector3(0, -radius / 3, 0);
    const pos1 = textPosition
        .clone()
        .add(lineHeightVector.clone().multiplyScalar(0))
        .clone();
    const pos2 = textPosition
        .clone()
        .add(lineHeightVector.clone().multiplyScalar(1))
        .clone();
    const pos3 = textPosition
        .clone()
        .add(lineHeightVector.clone().multiplyScalar(2))
        .clone();
    const energy = portal.resources.find(
        (resource) => resource.resource == ResourceType.Energy,
    );
    const energyAmount = energy ? energy.mass : 0;

    //console.log("404::resources main", portal.resources)
    return (
        <>
            {/* <CustomText size={radius / 3.6} color="white" position={textPosition}>
                {truncateAddress(portal.owner)}
            <CustomText size={radius / 3} color="white" position={textPosition}>
                {displayName}
            </CustomText>
            <CustomText
                size={radius / 12}
                position={textPosition
                    .clone()
                    .add(new THREE.Vector3(0, radius / 4, 0))}
            >
                PORTAL
            </CustomText> */}
            <CustomText
                    size={radius / 3.0}
                    color="white"
                    position={textPosition}
                >
                    {portal.mass.toFixed(2)}
                    
                </CustomText>
                
            <group position={textPosition}>
            <CustomText 
                size={radius / 8} 
                color="white" position={new THREE.Vector3(0, -radius/4, 0)}
            >
                {truncateAddress(portal.owner)}
            </CustomText>
                
                {/* <CustomText
                    size={radius / 8}
                    color="blue"
                    position={new THREE.Vector3(radius / 15, 0, 0)}
                    anchorX="left"
                >
                    {energyAmount.toFixed(2)} EP
                </CustomText> */}
            </group>
        </>
    );
};
