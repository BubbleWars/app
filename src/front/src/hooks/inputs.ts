import { useChainId, useContractWrite } from "wagmi";
import {
    CartesiDAppAddress,
    EtherPortal,
    InputBox,
    currentChain,
} from "../contracts";
import { Input, InputType } from "../../../core/types/inputs";
import { parseEther, toHex, zeroAddress } from "viem";
import { useEffect, useState } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import {
    useWallets,
    usePrivy,
    UnsignedTransactionRequest,
} from "@privy-io/react-auth";
import { burnerAccount, burnerAddress } from "../config";
import { publicClient } from "../main";
import { currentState } from "../../../core/world";
import { encodeFunctionData } from "viem";
import { getChainId } from "node_modules/viem/_types/actions/public/getChainId";
import { call } from "node_modules/viem/_types/actions/public/call";

export const useCreateInput = (input: Input) => {
    //console.log("useCreateInput", input)
    //Check if deposit input

    const { sendTransaction } = usePrivy();
    const [nonce, setNonce] = useState<number | undefined>(undefined);
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const isDeposit = input.type == InputType.Deposit;
    const functionName = isDeposit ? "depositEther" : "addInput";
    const args = isDeposit
        ? [CartesiDAppAddress, zeroAddress]
        : [CartesiDAppAddress, toHex(JSON.stringify(input))];
    const contract = isDeposit ? EtherPortal : InputBox;
    const { wallets } = useWallets();

    const connectedAddress = wallets[0]?.address ? `${wallets[0].address}` : "";
    const value = isDeposit
        ? parseEther((input.amount ?? 0).toString())
        : undefined;

    // useEffect(() => {
    //     if (connectedAddress) {
    //         const fetchNonce = async () => {
    //             const transactionCount = await publicClient({
    //                 chainId: currentChain.id,
    //             }).getTransactionCount({
    //                 address: connectedAddress,
    //             });
    //             setNonce(transactionCount);
    //         };

    //         fetchNonce();
    //     }
    // }, [connectedAddress, publicClient]);

    // const val = useContractWrite({
    //     ...contract,
    //     functionName,
    //     args,

    //     value,
    //     nonce,
    // });

    // const unsignedTx: UnsignedTransactionRequest = {
    //     to: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    //     chainId: currentChain.id,
    //     value: "0x3B9ACA00",
    // };

    return {
        isError,
        isSuccess,
        isLoading,
        submitTransaction: async () => {
            // sendTransaction(unsignedTx);
            setIsLoading(true);
            const receipt = await sendTransaction({
                chainId: currentChain.id,
                data: encodeFunctionData({
                    abi: contract.abi,
                    functionName: functionName,
                    args: args,
                }),
                // from: connectedAddress,
                value: value,

                to: contract.address,
            });
            setNonce(nonce + 1);
            setIsLoading(false);
            if (receipt) {
                setIsSuccess(true);
                setIsError(false);
            } else {
                setIsSuccess(false);
                setIsError(true);
            }
        },
    };
};

export const useOnClick = (handler: (event: MouseEvent) => void) => {
    useEffect(() => {
        // Add event listener
        document.addEventListener("click", handler);

        // Clean up the event listener on component unmount
        return () => {
            document.removeEventListener("click", handler);
        };
    }, [handler]); // Re-run the effect only if the handler changes
};

export const useOnRightClick = (handler: (event: MouseEvent) => void) => {
    useEffect(() => {
        // Add event listener
        document.addEventListener("contextmenu", handler);

        // Clean up the event listener on component unmount
        return () => {
            document.removeEventListener("contextmenu", handler);
        };
    }, [handler]); // Re-run the effect only if the handler changes
}

export const useOnWheel = (onWheel: (event: WheelEvent) => void) => {
    useEffect(() => {
        // Handler to call on mouse wheel event
        const handleWheel = (event: WheelEvent) => {
            // Invoke the provided onWheel function with the wheel event
            onWheel(event);
        };

        // Add wheel event listener
        window.onwheel = () => {
            return false;
        };
        window.addEventListener("wheel", handleWheel);

        // Clean up the event listener on component unmount
        return () => {
            window.removeEventListener("wheel", handleWheel);
        };
    }, [onWheel]); // Re-run the effect only if the onWheel function changes
};

export const useMousePosition = (handler: (event: MouseEvent) => void) => {
    useEffect(() => {
        // Add mousemove event listener
        document.addEventListener("mousemove", handler);

        // Clean up the event listener on component unmount
        return () => {
            document.removeEventListener("mousemove", handler);
        };
    }, [handler]); // Re-run the effect only if the handler changes
};

export const waitForEmission = (
    id: string,
    initialMass: number,
    emissionMass: number,
    callback: () => void,
) => {
    const bubble = currentState.bubbles.find((bubble) => bubble.id == id);
    const portal = currentState.portals.find((portal) => portal.id == id);
   //console.log("wait for emission");
    let intervalId: NodeJS.Timeout;
    let timeoutId: NodeJS.Timeout;

    // Function to clear both interval and timeout
    const clearTimers = () => {
        clearInterval(intervalId);
        clearTimeout(timeoutId);
    };

    // Function to check conditions and possibly clear interval
    const checkAndClear = (currentMass: number) => {
       //console.log("8899 initialMass", initialMass, "currentMass", currentMass, "emissionMass", emissionMass);
        if (currentMass <= initialMass) {
            clearTimers();
            callback();
        }
    };

    if (bubble) {
        // Check for mass to decrease by emissionMass
        intervalId = setInterval(() => {
            const newBubble = currentState.bubbles.find(
                (bubble) => bubble.id.toLowerCase() == id.toLowerCase(),
            );
            if (newBubble) {
               //console.log("8899 Checking bubble mass. emission:", newBubble.mass, "initialMass:", initialMass)
                checkAndClear(newBubble.mass);
            }else {
               //console.log("8899 Bubble not found");
                clearTimers();
                callback();
            }
        }, 1000);
    } else if (portal) {
        intervalId = setInterval(() => {
            const newPortal = currentState.portals.find(
                (portal) => portal.id == id,
            );
            if (newPortal) {
               //console.log("8899 Checking portal mass. emission:", newPortal.mass, "initialMass:", initialMass )
                checkAndClear(newPortal.mass);
            }else {
               //console.log("8899 Portal not found");
                clearTimers();
                callback();
            }
        }, 1000);
    }

    // Set a timeout to force callback execution after 10 seconds
    // timeoutId = setTimeout(() => {
    //     clearTimers(); // Ensure to clear the interval as well
    //     callback(); // Force the callback execution
    // }, 10000);

    // Return a cleanup function to clear interval and timeout
    return clearTimers;
};
