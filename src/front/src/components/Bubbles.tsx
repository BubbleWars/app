import {
    ethereumAddressToColor,
    massToRadius,
} from "../../../core/funcs/utils";
import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { currentState } from "../../../core/world";
import { BubblesInfo } from "./BubblesInfo";
import { BubblesControlsEmit } from "./BubblesControlsEmit";
import { Outlines } from "@react-three/drei";
import { darkenColor } from "../utils";
import { MathUtils } from "three";
import { bubbleStartPositions } from "./Game";
import { useDispatch, useSelector } from "react-redux";
import {
    setIsBubbleSelected,
    setSelectedEntityId,
} from "../store/interpolation";
import { burnerAddress } from "../config";

export const Bubble = ({ bubbleId }: { bubbleId: string }) => {
    const meshRef = useRef<any>();
    const [isHovered, setIsHovered] = useState<boolean>(false);
    const dispatch = useDispatch();
    const setIsSelected = (isSelected1: boolean) => {
        dispatch(setIsBubbleSelected(isSelected1));
        dispatch(setSelectedEntityId(isSelected1 ? bubbleId : null));
    };
    const selectedBubbleId = useSelector(
        (state: any) => state.interpolation.selectedEntityId,
    );
    const isBubbleSelected = useSelector(
        (state: any) => state.interpolation.isBubbleSelected,
    );
    const isSelected = isBubbleSelected && selectedBubbleId == bubbleId;

    useFrame(() => {
        const bubble = currentState.bubbles.find(
            (bubble) => bubble.id === bubbleId,
        );
        if (!bubble) {
            //console.log("bubble not found")
            return;
        }

        if (!meshRef.current) {
            //console.log("bubble not found")
            return;
        }

        if (!meshRef.current.position.x || !meshRef.current.position.y) {

            const startPosition = bubbleStartPositions[bubbleId];
            console.log("fetching start position", startPosition)
            if (startPosition) {
                meshRef.current.position.set(
                    startPosition.x,
                    startPosition.y,
                    0,
                );
            } else {
                //console.log("bubble start position not found")
            }
            //console.log("bubble not found")
        }
        const radius = massToRadius(bubble.mass);
        const newRadius = MathUtils.lerp(meshRef.current.scale.x, radius, 0.1);
        meshRef.current.scale.set(newRadius, newRadius, newRadius);
        //console.log("bubble position:", bubble.position)
        const newX = MathUtils.lerp(
            meshRef.current.position.x,
            bubble.position.x,
            0.05,
        );
        const newY = MathUtils.lerp(
            meshRef.current.position.y,
            bubble.position.y,
            0.05,
        );
        meshRef.current.position.set(newX, newY, 0);
        meshRef.current.updateMatrix();
    });

    const owner =
        currentState.bubbles.find((bubble) => bubble.id == bubbleId)?.owner ??
        "";
    const baseColor = ethereumAddressToColor(owner);
    const outlineColor = darkenColor(baseColor, 0.25); // Darken by 20%

    // useEffect(() => {
    //     //console.log("setIsBubbleSelected: ui", isSelected)
    //     dispatch(setIsBubbleSelected(isSelected));
    // }, [isSelected]);

    return (
        <>
            <mesh
                ref={meshRef}
                onPointerEnter={() => {
                    if (!isSelected) setIsHovered(true);
                }}
                onPointerMissed={() => {
                    setIsHovered(false)
                    setIsBubbleSelected(false)
                }}
                onPointerLeave={() => setIsHovered(false)}
                onClick={() => {
                    if(burnerAddress.toLowerCase() == owner.toLowerCase()) {
                        setIsSelected(!isSelected && isHovered);
                        setIsHovered(false);
                    }
                }}
                onContextMenu={() => setIsSelected(false)}
            >
                <sphereGeometry />
                <Outlines thickness={0.1} color={outlineColor} />
                <meshBasicMaterial toneMapped={false} color={baseColor} />
            </mesh>

            {isSelected && (
                <BubblesControlsEmit
                    isHovered={isHovered}
                    bubbleId={bubbleId}
                />
            )}
            <BubblesInfo
                bubbleId={bubbleId}
                position={meshRef.current?.position}
            />
        </>
    );
};

export const Bubbles = ({ bubbles }: { bubbles: string[] }) => {
    return bubbles.map((bubble, index) => (
        <Bubble key={bubble} bubbleId={bubble} />
    ));
};
