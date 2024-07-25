import * as THREE from "three";
import { massToRadius } from "../../../core/funcs/utils";
import { currentState, rollbackToState } from "../../../core/world";
import { useEffect, useRef, useState } from "react";
import { Line, Text, Text3D } from "@react-three/drei";
import { extend, useFrame, useThree } from "@react-three/fiber";
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
import { Vec2 } from "planck-js";
import { CustomText } from "./CustomText";
import { ResourceType } from "../../../core/types/resource";
import { setControlsActive, setIsBubbleSelected } from "../store/interpolation";

import { useWallets } from "@privy-io/react-auth";
import { getPortalMass } from "../../../core/funcs/portal";
import { PLANCK_MASS } from "../../../core/consts";
import { setDepositControlsActive, setWithdrawControlsActive } from "@/store/controls";

export const PortalsControlsEmit = ({
    portalId,
    isHovered,
}: {
    portalId: string;
    isHovered: boolean;
}) => {
    const dispatch = useDispatch();
    const { wallets } = useWallets();

    const connectedAddress = wallets[0]?.address ? `${wallets[0].address}` : "";
    const portal = currentState.portals.find(
        (portal) => portal.id === portalId,
    );
    if (!portal) return null;
    const radius = massToRadius(portal.mass);
    const position = new THREE.Vector3(portal.position.x, portal.position.y, 0);
    const length = radius + 5;
    const [direction, setDirection] = useState<THREE.Vector3>(
        new THREE.Vector3(1, 0, 0),
    );
    const [hasProcessedTx, setHasProcessedTx] = useState(false);
    const [isEmitting, setIsEmitting] = useState<boolean>(false);
    const [mass, setMass] = useState<number>(0.05);
    const [emitEth, setEmitEth] = useState<boolean>(true);
    const [depositHover, setDepositHover] = useState<boolean>(false);
    const [withdrawHover, setWithdrawHover] = useState<boolean>(false);
    const [emitEp, setEmitEp] = useState<boolean>(false);
    const [isReady, setIsReady] = useState<boolean>(false);
    const lineRef = useRef<any>();
    const address = connectedAddress;
    const blueMass = portal.resources.find( (resource) => resource.resource == ResourceType.Energy)?.mass ?? 0
    const ethMass = portal.mass - blueMass

    const { viewport } = useThree();

    //Input action
    const { write, isError, isLoading, isSuccess, data, submitTransaction } =
        useCreateInput({
            type: InputType.Emit,
            mass,
            from: portalId,
            direction: { x: direction.x, y: direction.y },
            emissionType: emitEth ? "bubble" : ResourceType.Energy,
        });

    //Now get mouse position
    useFrame(({ pointer, camera, mouse }) => {
        if (isError || isLoading || isSuccess) return;
        camera.updateProjectionMatrix();
        const x = ((pointer.x * viewport.getCurrentViewport().width) / 2) + camera.position.x;
        const y = (pointer.y * viewport.getCurrentViewport().height) / 2 + camera.position.y;
        const worldMouse = new THREE.Vector3(x, y, 0);

       //console.log("bb x:", x, " y:", y, "viewport width:", viewport.width, "viewport height:", viewport.height)
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
            waitForEmission(portalId, portal.mass, mass, () => {
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
    //                 from: portalId,
    //                 direction: { x: direction.x, y: direction.y },
    //                 sender: address,
    //                 executionTime: timestamp,
    //                 prediction: true,
    //                 emissionType: emitEth ? "bubble" : ResourceType.Energy,
    //             };
    //             dispatch(addInput(input));
    //             dispatch(setIsBubbleSelected(false));
    //             setHasProcessedTx(true);
    //             setIsEmitting(false);
    //             //console.log("is predicting portal", input)

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

    // Scroll action
    useOnWheel((event) => {
        if (isError || isLoading || isSuccess) return;
        
        const maxMass = emitEth ? ethMass : blueMass;
        const minMass = PLANCK_MASS;
        const baseStep = PLANCK_MASS;
        
        // Determine the adaptive step size
        const delta = event.deltaY;
        const absDelta = Math.abs(delta);
        let adaptiveStep = baseStep;
        
        if (absDelta > 50) {
            adaptiveStep = baseStep * 10;
        } else if (absDelta > 20) {
            adaptiveStep = baseStep * 5;
        } else if (absDelta > 10) {
            adaptiveStep = baseStep * 2;
        }
        
        const newMass = Math.min(
            Math.max(mass + (delta / 100) * adaptiveStep, minMass),
            maxMass
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
                        {mass.toFixed(3)} {emitEth ? "ETH" : emitEp ? "EP" : "blanks"}
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
                    position={new THREE.Vector3(
                        radius + 2,
                        radius + 2,
                        0,
                    ).add(position)}
                        onPointerEnter={() => {
                            setEmitEth(true);
                            setMass(ethMass/10);
                            setEmitEp(false);
                            setWithdrawHover(false);
                            setDepositHover(false);
                        }}
                        onPointerLeave={() => {
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
                            size={emitEth ? 1.2 : 1.1}
                            position={new THREE.Vector3(
                                0,
                                0,
                                0,
                            )}
                            anchorX="center"
                            anchorY="center"
                            color="white"
                        >
                            Emit ETH
                        </CustomText>
                        
                    </group>
                    <group
                    position={new THREE.Vector3(
                        radius + 2,
                        radius + 2 - 1,
                        0,
                    ).add(position)}
                    onPointerEnter={() => {
                        setDepositHover(true);
                        setWithdrawHover(false);
                    }}
                    onPointerLeave={() => {
                        setDepositHover(false);
                    }}
                    onPointerDown={() => {
                        setTimeout(() => {
                            dispatch(setDepositControlsActive(true));
                        }, 250);
                    }}
                    >
                        <CustomText
                            size={depositHover ? 1.2 : 1.1}
                            position={new THREE.Vector3(
                                0,
                                0,
                                0,
                            )}
                            anchorX="center"
                            anchorY="center"
                            color="white"
                        >
                            Deposit
                            </CustomText>
                        
                    </group>
                    <group
                    position={new THREE.Vector3(
                        radius + 2,
                        radius + 2 - 2,
                        0,
                    ).add(position)}
                    onPointerEnter={() => {
                        setWithdrawHover(true);
                        setDepositHover(false);
                    }}
                    onPointerLeave={() => {
                        setWithdrawHover(false);
                    }}
                    onPointerDown={() => {
                        setTimeout(() => {
                            dispatch(setWithdrawControlsActive(true));
                        }, 250);
                    }}
                    >
                        <CustomText
                            size={withdrawHover ? 1.2 : 1.1}
                            position={new THREE.Vector3(
                                0,
                                0,
                                0,
                            )}
                            anchorX="center"
                            anchorY="center"
                            color="white"
                            >
                                Withdraw
                            </CustomText>
                    </group>
                    {/* <group
                    position={new THREE.Vector3(
                        radius + 2,
                        radius + 2 - 2,
                        0,
                    ).add(position)}
                        onPointerEnter={() => {
                            
                        }}
                        onPointerLeave={() => {
                            setEmitEp(false);
                            setMass(ethMass/10);
                            setEmitEth(true);
                        }}
                        onPointerDown={() => {
                            setIsReady(true);
                            setTimeout(() => {
                                dispatch(setControlsActive(true));
                            }, 250);
                        }}
                    >
                        <CustomText
                            size={emitEp ? 1.2 : 1.1}
                            position={new THREE.Vector3(
                                0,
                                0,
                                0,
                            )}
                            anchorX="center"
                            anchorY="center"
                            color="white"
                        >
                            Emit EP
                        </CustomText>
                    </group> */}
                </>
            )}
        </>
    );
};
