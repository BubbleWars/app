import React, { useCallback, useEffect, useMemo } from "react";
import { useAccount, useBalance, useConnect } from "wagmi";
import { truncateAddress } from "../../../../core/funcs/utils";

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

import { usePrivy, useWallets } from "@privy-io/react-auth";

const faucetClient = createFaucetClient({
    url: FAUCET_URL,
});

export const ScreenTitle = () => {
    const { authenticated, ready, logout } = usePrivy();
    const { wallets } = useWallets();
    const connectedAddress = wallets[0]?.address ? `${wallets[0].address}` : "";

   //console.log("The connected address is:   " + connectedAddress);

    const [buttonText, setButtonText] = React.useState("Connect");
    const [isButtonClicked, setButtonClicked] = React.useState(false);
    const [fetchingFunds, setFetchingFunds] = React.useState(false);
    const [buttonDisabled, setButtonDisabled] = React.useState(true);

    const { data, isError, isLoading } = useBalance({
        address: connectedAddress,
        chainId: currentChain.id,
    });

    const accountDefined = useMemo(() => {
        return connectedAddress !== "";
    }, [connectedAddress]);

    const balance = useMemo(() => {
        return parseFloat(data?.formatted ?? "0");
    }, [data]);

   //console.log("The balance is:   " + balance);

    const shouldFetchFunds = useMemo(() => {
        if (isError || isLoading || !data) return false;
        if(connectedAddress === "") return false;
        return balance <= 0.5;
    }, [balance, isError, isLoading, data, connectedAddress]);

    const fetchFunds = useCallback(() => {
        const _ = async () => {
            setFetchingFunds(true);
            const tx = await faucetClient.drip.mutate({
                address: connectedAddress,
            });
            await waitForTransaction({
                chainId: currentChain.id,
                hash: tx,
                confirmations: 1,
            });
            setFetchingFunds(false);
        };
        _();
    }, [connectedAddress]);

    useEffect(() => {
        if (shouldFetchFunds) fetchFunds();
    }, [shouldFetchFunds]);

    useEffect(() => {
        if (!authenticated || !ready || !accountDefined) {
            setButtonText("Logging in...");
            setButtonDisabled(true);
        } else if (fetchingFunds) {
            setButtonText("Fetching funds for burner...");
            setButtonDisabled(true);
        } else if (authenticated && ready) {
            setButtonText("Play " + truncateAddress(connectedAddress));
            setButtonDisabled(false);
        } else {
            setButtonText("Play");
            setButtonDisabled(false);
        }
    }, [authenticated, ready, fetchingFunds, balance, isLoading, data, shouldFetchFunds]);
    const { login } = usePrivy();
    const isFunded = useMemo(() => {
        return balance > 0
    }, [balance])

    if (isButtonClicked) return null;

    return (
        <div className="screen-title">
            <Card className="w-[550px] h-[550px] flex flex-col justify-center">
      <CardHeader>
        <CardTitle className="w-full text-center ">
            Bubblewars.io
        </CardTitle>
        <CardDescription className="text-center">Absorb ETH. Grow your bubbles. Conquer the infinite canvas.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="screen-title-buttons text-center">
                <Button
                    className="text-center"
                    disabled={buttonDisabled}
                onClick={() => {
                    if(!authenticated) login();
                    setButtonClicked(true);
                }}>
                {buttonText}
                </Button>
            </div>
            </CardContent>
        </Card>
            
        </div>
    );
};
