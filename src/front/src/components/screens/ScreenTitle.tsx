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
import { usePrivy } from "@privy-io/react-auth";

const faucetClient = createFaucetClient({
    url: FAUCET_URL,
});

export const ScreenTitle = () => {
    const [buttonText, setButtonText] = React.useState("Connect");
    const [fetchingFunds, setFetchingFunds] = React.useState(false);
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
            setFetchingFunds(true);
            const tx = await faucetClient.drip.mutate({
                address: burnerAddress as "0x{string}",
            });
            await waitForTransaction({
                chainId: currentChain.id,
                hash: tx,
                confirmations: 1,
            });
            setFetchingFunds(false);
        };
        _();
    }, [burnerAddress]);

    useEffect(() => {
        if (shouldFetchFunds) fetchFunds();
    }, [shouldFetchFunds]);

    useEffect(() => {
        if (fetchingFunds) {
            setButtonText("Fetching funds for burner...");
        } else if (isConnected) {
            setButtonText("Connected to " + truncateAddress(burnerAddress));
        } else if (isConnecting) {
            setButtonText("Loading...");
        } else {
            setButtonText("Play");
        }
    }, [isConnected, isConnecting, address, fetchingFunds, balance]);
    const { login } = usePrivy();
    // const isFunded = useMemo(() => {
    //     return balance > 0
    // }, [balance])

    if (isConnected) return null;

    return (
        <div className="screen-title">
            <h1>Bubblewars.io</h1>
            <p>Absorb ETH. Grow your bubbles. Conquer the infinite canvas.</p>
            <div className="screen-title-buttons">
                <button
                    onClick={() => {
                        connect();
                        login();
                    }}
                >
                    {buttonText}
                </button>
            </div>
        </div>
    );
};
