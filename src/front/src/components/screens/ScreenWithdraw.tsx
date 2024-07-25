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
import { setWithdrawControlsActive } from "@/store/controls";
import { usePendingWithdrawals } from "@/hooks/vouchers";
import { is } from "@react-three/fiber/dist/declarations/src/core/utils";
import { useInterval } from "@/hooks/state";

export const ScreenWithdraw = () => {
    const { wallets } = useWallets();
    const { authenticated } = usePrivy();
    const connectedAddress = wallets[0]?.address ? `${wallets[0].address}` : "";
    const address = connectedAddress;

    const { 
        pendingWithdrawals, 
        executeWithdrawal, 
        isExecuting,
        canExecute,
        isFinished,
    } = usePendingWithdrawals();

    console.log("pendingWithdrawals", pendingWithdrawals);

    const [buttonText, setButtonText] = React.useState("Withdraw");
    const [portalBalance, setPortalBalance] = React.useState(0);
    //const [ dripText, setDripText ] = React.useState('Drip')
    const [amount, setAmount] = useState(0);
    const dispatch = useDispatch();

    const { data } = useBalance({
        address: connectedAddress,
        chainId: currentChain.id,
        watch: true,
    });

    const balance = useMemo(() => {
        return parseFloat(data?.formatted ?? "0");
    }, [data]);

    const portal = useMemo(() => {
        return currentState.portals.find(
            (portal) => portal.owner.toLowerCase() === address?.toLowerCase(),
        );
    }, [currentState.portals, address]);

    useInterval(() => {
        const portal = currentState.portals.find(
            (portal) => portal.owner.toLowerCase() === address?.toLowerCase(),
        );
        setPortalBalance(portal?.mass ?? 0);
    }, 1000);

    const {
        //write,
        isError,
        isLoading,
        isSuccess,
        submitTransaction,
    } = useCreateInput({
        type: InputType.Withdraw,
        amount,
    });


    if (!authenticated) return null;

    return (
        <div className="screen-title">
            <Card className="w-[550px] h-[550px] flex flex-col justify-center">
                <CardHeader>
                    <CardTitle className="w-full text-center ">
                        Withdraw Eth from your portal.
                    </CardTitle>
                    <CardDescription className="w-full text-center">
                        By withdrawing ETH from your portal you are withdrawing funds from our L3 to the Base Layer 2
                        Your Base L2 Balance ({balance.toFixed(4)})ETH.
                        Your Portal (L3) Balance ({portalBalance.toFixed(4)})ETH.

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
                            disabled={isError || isLoading || isSuccess || amount <= 0 || amount > portalBalance}
                            onClick={() => {
                                submitTransaction?.();
                                setButtonText("Withdrawing...");
                            }}
                        >
                            {isSuccess ? "Success!" : buttonText}
                        </button>
                        <button
                            onClick={() => {
                                dispatch(setWithdrawControlsActive(false));
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
                    <div>
                        {
                            pendingWithdrawals.map((withdrawal, index) => {
                                return (
                                    <div key={index} className="withdrawal">
                                        <p>{withdrawal.amount} ETH</p>
                                        <button
                                            onClick={() => {
                                                executeWithdrawal(index);
                                            }}
                                        >
                                            {!canExecute(index) ? "Pending" : isExecuting(index) ? "Withdrawing..." : isFinished(index) ? "Finished" : "Withdraw"}
                                        </button>
                                    </div>
                                );
                            })
                        }
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
