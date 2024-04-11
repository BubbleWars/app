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
    );
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
    const energy = bubble.resources.find(
        (resource) => resource.resource == ResourceType.Energy,
    );
    const energyAmount = energy ? energy.mass : 0;

    //console.log("resources main", bubble.resources)
    return (
        <>
            <CustomText size={radius / 3} position={textPosition}>
                @{displayName}
            </CustomText>
            <group position={pos2}>
                <CustomText
                    size={radius / 8}
                    color="green"
                    position={new THREE.Vector3(-0, 0, 0)}
                    anchorX="right"
                >
                    {(bubble.mass - energyAmount).toFixed(2)} ETH
                </CustomText>
                <CustomText
                    size={radius / 8}
                    color="blue"
                    position={new THREE.Vector3(radius / 7, 0, 0)}
                    anchorX="left"
                >
                    {energyAmount.toFixed(2)} EP
                </CustomText>
            </group>

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
        </>
    );
};
