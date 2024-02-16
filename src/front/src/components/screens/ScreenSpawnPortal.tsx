import React, { useEffect, useMemo, useState } from 'react';
import { useAccount, useConnect } from "wagmi";
import { InjectedConnector } from "wagmi/connectors/injected";
import { truncateAddress } from "../../../../core/funcs/utils";
import { ActionDeposit } from '../ActionDeposit';
import { currentState } from '../../../../core/world';
import { useCreateInput } from '../../hooks/inputs';
import { InputType } from '../../../../core/types/inputs';


export const ScreenSpawnPortal = () => {
    const { address, isConnected } = useAccount()
    const [ buttonText, setButtonText ] = React.useState('Spawn')
    const [amount, setAmount] = useState(100)
    const { 
        write,
        isError, 
        isLoading, 
        isSuccess
    } = useCreateInput({
        type: InputType.Deposit, 
        amount,
    })

    const [isPortal, setIsPortal] = useState(false)


    useEffect(() => {
        // Set up the interval
        const portal = currentState.portals.find(portal => portal.owner.toLowerCase() === address?.toLowerCase());
            if (portal) setIsPortal(true);
        const intervalId = setInterval(() => {
            const portal = currentState.portals.find(portal => portal.owner.toLowerCase() === address?.toLowerCase());
            if (portal) setIsPortal(true);
        }, 1000);
    
        // Clear the interval on component unmount or if the dependencies change
        return () => clearInterval(intervalId);
    }, [address]);

    if(!isConnected) return null
    if(isPortal) return null

    return (
        <div className="screen-title">
            <h2>Spawn your portal.</h2>
            <p>This is where all of your bubbles will be emitted from. You will spawn in a random place</p>
            <div className='button-group'>
                <div className='input-bg'>
                <input type="number" value={amount} onChange={(e) => setAmount(parseInt(e.target.value))} />
                <h2>ETH</h2>
                </div>
            <button 
            disabled={isError || isLoading}
            onClick={
                () => {
                    write?.()
                    setButtonText('Spawning...')
                }
                
            }
        >

            <p>{buttonText}</p>
        </button>
            </div>
            

        </div>
    );
}
