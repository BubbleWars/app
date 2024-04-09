import { Text3D } from "@react-three/drei";
import { currentState } from "../../../core/world";
import { massToRadius, truncateAddress } from "../../../core/funcs/utils";
import * as THREE from "three";
import { CustomText } from "./CustomText";
import { ResourceType } from "../../../core/types/resource";
import { useDisplayName } from "./GetDisplayName";
import { useUserSocial } from "@/hooks/socials";

export const PortalsInfo = ({ portalId }: { portalId: string }) => {
    const portal = currentState.portals.find(
        (portal) => portal.id === portalId,
    );
    //    const currentUserSocials = useUserSocial({ address: portal.owner });
    //console.log("wasteyute", currentUserSocials);
    const { social } = useUserSocial({ address: portal.owner });
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
            </CustomText>
            <group position={pos2}>
                <CustomText
                    size={radius / 8}
                    color="green"
                    position={new THREE.Vector3(-0, 0, 0)}
                    anchorX="right"
                >
                    {portal.mass.toFixed(2)} ETH
                </CustomText>
                <CustomText
                    size={radius / 8}
                    color="blue"
                    position={new THREE.Vector3(radius / 15, 0, 0)}
                    anchorX="left"
                >
                    {energyAmount.toFixed(2)} EP
                </CustomText>
            </group>
        </>
    );
};
