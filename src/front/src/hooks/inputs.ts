import { useContractWrite } from "wagmi";
import { CartesiDAppAddress, EtherPortal, InputBox } from "../contracts";
import { Input, InputType } from "../../../core/types/inputs";
import { parseEther, toHex, zeroAddress } from "viem";


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