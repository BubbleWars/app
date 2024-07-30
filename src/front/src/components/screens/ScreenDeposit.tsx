import React, { useEffect, useMemo, useState } from "react";
import { useAccount, useBalance } from "wagmi";
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
import { currentChain } from "@/contracts";
import { setDepositControlsActive } from "@/store/controls";

export const ScreenDeposit = () => {
    const { wallets } = useWallets();
    const { authenticated } = usePrivy();
    const connectedAddress = wallets[0]?.address ? `${wallets[0].address}` : "";
    const address = connectedAddress;
   //console.log("This is the current address: 420 ", address);

    const [buttonText, setButtonText] = React.useState("Deposit");
    //const [ dripText, setDripText ] = React.useState('Drip')
    const [amount, setAmount] = useState(10);
    const dispatch = useDispatch();

    const { data } = useBalance({
        address: connectedAddress,
        chainId: currentChain.id,
    });

    const balance = useMemo(() => {
        return parseFloat(data?.formatted ?? "0");
    }, [data]);

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


    if (!authenticated) return null;

    return (
        <div className="screen-title">
            <Card className="w-[550px] h-[550px] flex flex-col justify-center">
                <CardHeader>
                    <CardTitle className="w-full text-center ">
                        Deposit Eth into your portal.
                    </CardTitle>
                    <CardDescription className="w-full text-center">
                        By depositing ETH into your portal, you are portaling funds for Base L2 to our App-Specific rollup.
                        You Base L2 Balance ({balance.toFixed(4)})ETH
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
                                        parseFloat(
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
                                setButtonText("Depositing...");
                            }}
                        >
                            {buttonText}
                        </button>
                        <button
                            onClick={() => {
                                dispatch(setDepositControlsActive(false));
                            }}
                        > 
                            Cancel
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
