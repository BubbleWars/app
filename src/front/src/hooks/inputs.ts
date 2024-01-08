import { useContractWrite } from "wagmi";
import { CartesiDAppAddress, EtherPortal, InputBox } from "../contracts";
import { Input, InputType } from "../../../core/types/inputs";
import { parseEther, toHex, zeroAddress } from "viem";
import { useEffect } from "react";


export const useCreateInput = (input: Input) => {
    //Check if deposit input
    const isDeposit = input.type == InputType.Deposit;
    const functionName = isDeposit ? 'depositEther' : 'addInput';
    const args = isDeposit ? 
        [CartesiDAppAddress, zeroAddress] :
        [CartesiDAppAddress, toHex(JSON.stringify(input))]
    const contract = isDeposit ? EtherPortal : InputBox;
    const value = isDeposit ? parseEther(input.amount.toString()) : undefined;
    return useContractWrite({
        ...contract,
        functionName,
        args,
        value,
    })
}

export const useOnClick = (handler: (event: MouseEvent) => void) => {
    useEffect(() => {
        // Add event listener
        document.addEventListener('click', handler);

        // Clean up the event listener on component unmount
        return () => {
            document.removeEventListener('click', handler);
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
        window.addEventListener('wheel', handleWheel);

        // Clean up the event listener on component unmount
        return () => {
            window.removeEventListener('wheel', handleWheel);
        };
    }, [onWheel]); // Re-run the effect only if the onWheel function changes
}
