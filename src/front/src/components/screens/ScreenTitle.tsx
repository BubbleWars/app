import React, { useEffect } from 'react';
import { useAccount, useConnect } from "wagmi";
import { InjectedConnector } from "wagmi/connectors/injected";
import { truncateAddress } from "../../../../core/funcs/utils";

export const ScreenTitle = () => {
    const [ buttonText, setButtonText ] = React.useState('Connect')
    const { address, isConnected, isConnecting } = useAccount()
    const { connect } = useConnect({connector: new InjectedConnector()})

    useEffect(() => {
        if (isConnected) {
            setButtonText('Connected to ' + truncateAddress(address))
        } else if (isConnecting) {
            setButtonText('Connecting...')
        } else {
            setButtonText('Connect')
        }
    }, [isConnected, isConnecting, address])

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
