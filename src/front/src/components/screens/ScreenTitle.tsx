import React, { useCallback, useEffect, useMemo } from "react";
import { useAccount, useBalance, useConnect } from "wagmi";
import { truncateAddress } from "../../../../core/funcs/utils";
import { burnerAccount, burnerAddress } from "../../config";
import { createClient as createFaucetClient } from "@latticexyz/faucet";
import { FAUCET_URL, RPC_URL } from "../../consts";
import { createWalletClient, http } from "viem";
import { MockConnector } from "wagmi/connectors/mock";
import { currentChain } from "../../contracts";
import { waitForTransaction } from "wagmi/actions";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
import { Button } from "../ui/button";


const faucetClient = createFaucetClient({
    url: FAUCET_URL,
});

export const ScreenTitle = () => {
    const [buttonText, setButtonText] = React.useState("Connect");
    const [ fetchingFunds, setFetchingFunds ] = React.useState(false)
    const { address, isConnected, isConnecting } = useAccount();
    const { connect } = useConnect({
        connector: new MockConnector({
            options: {
                chainId: currentChain.id,
                walletClient: createWalletClient({
                    account: burnerAccount,
                    transport: http(RPC_URL),
                }),
            },
            chains: [currentChain],
        }),
    });

    const { data, isError, isLoading } = useBalance({
        address: burnerAddress,
    });

    const balance = useMemo(() => {
        return parseFloat(data?.formatted ?? "0");
    }, [data]);

    const waitingForBalance = isLoading;

    const shouldFetchFunds = useMemo(() => {
        if (isError || isLoading) return false;
        return balance <= 0.5;
    }, [balance, isError, isLoading]);

    const fetchFunds = useCallback(() => {
        const _ = async () => {
            setFetchingFunds(true)
            const tx = await faucetClient.drip.mutate({
                address: burnerAddress as "0x{string}",
            });
            await waitForTransaction({chainId: currentChain.id, hash: tx, confirmations: 1})   
            setFetchingFunds(false)
        }
        _();
    }, [burnerAddress]);

    useEffect(() => {
        if (shouldFetchFunds) fetchFunds();
    }, [shouldFetchFunds]);

    useEffect(() => {
        if(fetchingFunds) {
            setButtonText("Fetching funds for burner...")
        } else if (isConnected) {
            setButtonText("Connected to " + truncateAddress(burnerAddress));
        } else if (isConnecting) {
            setButtonText("Loading...");
        } else {
            setButtonText("Play");
        }
    }, [isConnected, isConnecting, address, fetchingFunds, balance]);

    // const isFunded = useMemo(() => {
    //     return balance > 0
    // }, [balance])

    if (isConnected) return null;

    return (
        <div className="screen-title">
            <Card className="w-[550px] h-[550px] flex flex-col justify-center">
      <CardHeader>
        <CardTitle className="w-full text-center font-bold">
            Bubblewars.io
        </CardTitle>
        <CardDescription className="text-center">Absorb ETH. Grow your bubbles. Conquer the infinite canvas.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="screen-title-buttons text-center">
                <Button
                    className="w-[100px] text-center"
                onClick={() => {
                    connect();
                }}
                >
                {buttonText}
                </Button>
            </div>
            </CardContent>
        </Card>
            
        </div>
    );
};
