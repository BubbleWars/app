import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAccount, useBalance, useConnect, useSwitchNetwork } from "wagmi";
import { InjectedConnector } from "wagmi/connectors/injected";
import { truncateAddress } from "../../../../core/funcs/utils";
import { burnerAddress } from '../../config';
import { createClient as createFaucetClient } from "@latticexyz/faucet";
import { FAUCET_URL, RPC_URL } from '../../consts';
import { etherUnits } from 'viem';
import { ethers } from 'ethers';
import { BigNumberish } from 'ethers';

const faucetClient = createFaucetClient({
    url: FAUCET_URL
});

export const ScreenTitle = () => {
    const [ buttonText, setButtonText ] = React.useState('Connect')
    const [ isConnected, setConnected ] = React.useState(false)
    const [ isConnecting, setConnecting ] = React.useState(false)

    const connect = () =>{
        setConnecting(true)
        setTimeout(()=>{
            setConnected(true)
            setConnecting(false)
        }, 1000)
    }

    const { data, isError, isLoading } = useBalance({
        address: burnerAddress
    })

    const balance = useMemo(()=>{
        return parseFloat(data?.formatted ?? "0")
    }, [data])

    const waitingForBalance = isLoading

    const shouldFetchFunds = useMemo(() => {
        if(isError || isLoading) return false
        return balance <= 0
    }, [balance])

    const fetchFunds = useCallback(()=>{
        faucetClient.drip.mutate({
            address: burnerAddress as '0x{string}'
        });
    },[burnerAddress])

    useEffect(()=>{
        if(!waitingForBalance && shouldFetchFunds) fetchFunds()
    }, [shouldFetchFunds, waitingForBalance])

    useEffect(() => {
        if (isConnected) {
            setButtonText('Connected to ' + truncateAddress(burnerAddress))
        } else if (isConnecting) {
            setButtonText('Connecting...')
        } else {
            setButtonText('Connect')
        }
    }, [isConnected, isConnecting, address])

    const isFunded = useMemo(() => {
        return balance > 0
    }, [balance])

    if(isConnected) return null


    return (
        <div className="screen-title">
            <h1>Bubblewars.io</h1>
            <p>Absorb ETH. Grow your bubbles. Conquer the world.</p>
            <div className="screen-title-buttons">
                <button onClick={()=>{connect()}}>{buttonText}</button>
            </div>
        </div>
    );
}
