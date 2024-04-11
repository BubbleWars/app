import * as THREE from "three";
import { massToRadius } from "../../../core/funcs/utils";
import { currentState, rollbackToState } from "../../../core/world";
import { useEffect, useRef, useState } from "react";
import { Line, Text3D } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import {
    useCreateInput,
    useOnClick,
    useOnWheel,
    waitForEmission,
} from "../hooks/inputs";
import { Emit, InputType } from "../../../core/types/inputs";
import { useAccount, useWaitForTransaction } from "wagmi";
import { currentChain } from "../contracts";
import { getPublicClient } from "wagmi/actions";
import { handleInput } from "../../../core/funcs/inputs";
import {
    snapshotRollback,
    snapshotRun,
    snapshots,
} from "../../../core/snapshots";
import { useDispatch } from "react-redux";
import { addInput } from "../store/inputs";
import { CustomText } from "./CustomText";
import { ResourceType } from "../../../core/types/resource";
import { setControlsActive, setIsBubbleSelected } from "../store/interpolation";
import { setOnEvent } from "../../../core/funcs/events";
import { useWallets } from "@privy-io/react-auth";

export const BubblesControlsEmit = ({
    bubbleId,
    isHovered,
}: {
    bubbleId: string;
    isHovered: boolean;
}) => {
    const dispatch = useDispatch();
    const bubble = currentState.bubbles.find(
        (bubble) => bubble.id === bubbleId,
    );
    const wallets = useWallets();
    const connectedAddress = wallets[0]?.address ? `${wallets[0].address}` : "";
    if (!bubble) return null;
    const radius = massToRadius(bubble.mass);
    const position = new THREE.Vector3(bubble.position.x, bubble.position.y, 0);
    const length = 10;
    const [direction, setDirection] = useState<THREE.Vector3>(
        new THREE.Vector3(1, 0, 0),
    );
    const [hasProcessedTx, setHasProcessedTx] = useState(false);
    const [isEmitting, setIsEmitting] = useState<boolean>(false);
    const [mass, setMass] = useState<number>(bubble.mass / 10);
    const [emitEth, setEmitEth] = useState<boolean>(true);
    const [emitEp, setEmitEp] = useState<boolean>(false);
    const [isReady, setIsReady] = useState<boolean>(false);
    const lineRef = useRef<any>();
    const address = connectedAddress;
    const blueMass = bubble.resources.find( (resource) => resource.resource == ResourceType.Energy)?.mass ?? 0;
    const ethMass = bubble.mass - blueMass;

    //Input action
    const { write, isError, isLoading, isSuccess, data, submitTransaction } =
        useCreateInput({
            type: InputType.Emit,
            mass,
            from: bubbleId,
            direction: { x: direction.x, y: direction.y },
            emissionType: emitEth ? "bubble" : ResourceType.Energy,
        });

    //Now get mouse position
    useFrame(({ pointer, camera }) => {
        if (isError || isLoading || isSuccess) return;

        // Raycaster for converting pointer coordinates
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(
            new THREE.Vector2(pointer.x, pointer.y),
            camera,
        );

        // Assuming your 2D plane is at z = 0
        const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        const worldMouse = new THREE.Vector3();
        raycaster.ray.intersectPlane(planeZ, worldMouse);

        // Calculate the direction vector
        const directionVector = worldMouse.sub(position).normalize();

        setDirection(directionVector);

        //console.log("bb mouse:", worldMouse);
        //console.log("bb position:", position);
        //console.log("bb direction:", directionVector);
    });

    //Click action
    useOnClick(() => {
        if (isError || isLoading || isSuccess) {
            //dispatch(setIsBubbleSelected(false))
            return;
        }
        if (isReady) {
            //dispatch(setIsBubbleSelected(false))
            dispatch(setControlsActive(false));
            setIsEmitting(true);
            submitTransaction();
            waitForEmission(bubbleId, bubble.mass, mass, () => {
                dispatch(setIsBubbleSelected(false));
                setHasProcessedTx(true);
                setIsEmitting(false);
                setIsReady(false);
            });
        }
    });

    // //Tx prediction
    // const tx = useWaitForTransaction({
    //     chainId: currentChain.id,
    //     hash: data?.hash,
    //     confirmations: 1,
    // });
    // useEffect(() => {
    //     if (!tx) return;
    //     if (!tx.data?.blockNumber) return;
    //     if (hasProcessedTx) return;
    //     setHasProcessedTx(true);
    //     getPublicClient({ chainId: currentChain.id })
    //         .getBlock({ blockNumber: tx.data.blockNumber })
    //         .then((block) => {
    //             const timestamp = Number(block.timestamp);
    //             const input: Emit = {
    //                 type: InputType.Emit,
    //                 timestamp,
    //                 mass,
    //                 from: bubbleId,
    //                 direction: { x: direction.x, y: direction.y },
    //                 sender: address,
    //                 executionTime: timestamp,
    //                 prediction: true,
    //                 emissionType: emitEth ? "bubble" : ResourceType.Energy,
    //             };
    //             dispatch(addInput(input));
    //             setHasProcessedTx(true);
    //             setIsEmitting(false);
    //             //console.log("is predicting bubble", input)

    //             // //Client add input
    //             // const isBehind = input.timestamp < currentState.timestamp
    //             // if(isBehind) {
    //             //     const state = snapshots.get(input.timestamp)
    //             //     if(!state) return
    //             //     rollbackToState(state)
    //             // }
    //             // handleInput(input)

    //             // //Snapshot add input
    //             // snapshotRollback(input.timestamp)
    //             // handleInput(input, true)
    //             ////console.log("is predicting", input)
    //             ////console.log("is predicting", timestamp)
    //         });
    //     //console.log("tx:", tx)
    // }, [tx]);

    //Scroll action
    useOnWheel((event) => {
        if (isError || isLoading || isSuccess) return;
        const maxMass = emitEth ? ethMass : blueMass;
        const minMass = 0.05;
        const step = 0.01;
        const newMass = Math.min(
            Math.max(mass + (event.deltaY > 0 ? -step : step), minMass),
            maxMass,
        );
        setMass(newMass);
    });

    //if(isSuccess || isError) return null

    return (
        <>
            {isReady && !isEmitting && (
                <>
                    <Line
                        ref={lineRef}
                        color={"white"}
                        lineWidth={2}
                        dashed={true}
                        points={[
                            position,
                            position
                                .clone()
                                .add(direction.clone().multiplyScalar(length)),
                        ]}
                    />
                    {/* <text
                position={position.clone().add(direction.clone().multiplyScalar(length))}
            >
                {mass.toFixed(6)} ETH
            </text> */}
                    <CustomText
                        size={0.8}
                        color="white"
                        position={position
                            .clone()
                            .add(direction.clone().multiplyScalar(length))}
                    >
                        {`Emit \n`}
                        {mass.toFixed(3)} {emitEth ? "ETH" : "EP"}
                    </CustomText>
                </>
            )}
            {isEmitting && (
                <>
                    <Line
                        ref={lineRef}
                        color={"white"}
                        lineWidth={2}
                        dashed={true}
                        points={[
                            position,
                            position
                                .clone()
                                .add(direction.clone().multiplyScalar(length)),
                        ]}
                    />
                    {/* <text
                position={position.clone().add(direction.clone().multiplyScalar(length))}
            >
                {mass.toFixed(6)} ETH
            </text> */}
                    <CustomText
                        size={0.8}
                        color="white"
                        position={position
                            .clone()
                            .add(direction.clone().multiplyScalar(length))}
                    >
                        {`Emitting... \n`}
                    </CustomText>
                </>
            )}

            {!isReady && (
                <>
                    <group
                        onPointerEnter={() => {
                            setEmitEth(true);
                            setMass(ethMass / 10);
                            setEmitEp(false);
                        }}
                        onPointerDown={() => {
                            setTimeout(() => {
                                setIsReady(true);
                                dispatch(setControlsActive(true));
                            }, 250);
                        }}
                    >
                        <CustomText
                            size={emitEth ? 1.2 : 1.1}
                            position={new THREE.Vector3(
                                radius + 2,
                                radius + 2,
                                0,
                            ).add(position)}
                            anchorX="center"
                            anchorY="center"
                            color="white"
                        >
                            Emit ETH
                        </CustomText>
                    </group>
                    <group
                        onPointerEnter={() => {
                            setEmitEp(true);
                            setMass(Math.min(blueMass, mass));
                            setEmitEth(false);
                        }}
                        onPointerDown={() => {
                            setTimeout(() => {
                                setIsReady(true);
                                dispatch(setControlsActive(true));
                            }, 250);
                        }}
                    >
                        <CustomText
                            size={emitEp ? 1.2 : 1.1}
                            position={new THREE.Vector3(
                                radius + 2,
                                radius + 2 - 2,
                                0,
                            ).add(position)}
                            anchorX="center"
                            anchorY="center"
                            color="white"
                        >
                            Emit EP
                        </CustomText>
                    </group>
                </>
            )}
        </>
    );
};
