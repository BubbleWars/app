import React, { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { currentState } from "../../../../core/world";
import { useCreateInput } from "../../hooks/inputs";
import { InputType } from "../../../../core/types/inputs";

import { useDispatch } from "react-redux";
import { setPan } from "../../store/interpolation";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../ui/card";
import { useWallets, usePrivy } from "@privy-io/react-auth";

export const ScreenSpawnPortal = () => {
    const { wallets } = useWallets();
    const { authenticated } = usePrivy();
    const connectedAddress = wallets[0]?.address ? `${wallets[0].address}` : "";
    const address = connectedAddress;
    console.log("This is the current address: 420 ", address);

    const [buttonText, setButtonText] = React.useState("Spawn");
    //const [ dripText, setDripText ] = React.useState('Drip')
    const [amount, setAmount] = useState(100);
    const dispatch = useDispatch();

    const {
        //write,
        isError,
        isLoading,
        //isSuccess,
        submitTransaction,
    } = useCreateInput({
        type: InputType.Deposit,
        amount,
    });

    const [isPortal, setIsPortal] = useState(false);

    useEffect(() => {
        // Set up the interval
        const portal = currentState.portals.find(
            (portal) => portal.owner.toLowerCase() === address?.toLowerCase(),
        );

        if (portal) setIsPortal(true);
        const intervalId = setInterval(() => {
            const portal = currentState.portals.find(
                (portal) =>
                    portal.owner.toLowerCase() === address?.toLowerCase(),
            );
            console.log(
                "These are the current portals 69:  ",
                currentState.portals,
            );
            console.log("this is the current address 69: ", address);
            if (portal) {
                setIsPortal(true);
                dispatch(
                    setPan({ x: portal.position.x, y: portal.position.y }),
                );
                clearInterval(intervalId);
            }
        }, 1000);

        // Clear the interval on component unmount or if the dependencies change
        return () => clearInterval(intervalId);
    }, [address, authenticated]);

    if (!authenticated) return null;
    if (isPortal) return null;

    return (
        <div className="screen-title">
            <Card className="w-[550px] h-[550px] flex flex-col justify-center">
                <CardHeader>
                    <CardTitle className="w-full text-center font-bold">
                        Spawn your portal
                    </CardTitle>
                    <CardDescription className="w-full text-center">
                        This is where all of your bubbles will be emitted from.
                        You will spawn in a random place
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="button-group">
                        <div className="input-bg">
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) =>
                                    setAmount(
                                        parseInt(
                                            e.target.value
                                                ? e.target.value
                                                : "0",
                                        ),
                                    )
                                }
                            />
                            <p>ETH</p>
                        </div>
                        <button
                            disabled={isError || isLoading}
                            onClick={() => {
                                submitTransaction?.();
                                setButtonText("Spawning...");
                            }}
                        >
                            {buttonText}
                        </button>

                        {/* <button 
            disabled={isError || isLoading}
            onClick={
                () => {
                    drip()
                    setDripText('Dripping...')
                }
                
            }
        >

            <p>{dripText}</p>
        </button> */}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
