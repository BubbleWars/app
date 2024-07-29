import { useVouchersQuery, useVoucherQuery, VoucherDocument } from "@/generated-src/graphql"
import { BigNumber, ethers } from "ethers";
import React, { useCallback, useMemo } from "react";
import { useEffect } from "react";
import { useRollups } from "./rollups";
import { CartesiDAppAddress } from "@/contracts";
import { useWallets } from "@privy-io/react-auth";
import { get } from "http";
import { Client, gql, useClient } from "urql";
import { useInterval } from "./state";

export const fetchVoucherDetails = async (client: Client, voucherIndex: number, inputIndex: number) => {
  const { data, error } = await client.query(VoucherDocument, { voucherIndex, inputIndex }).toPromise();

  if (error) {
    console.error('Error fetching voucher details:', error);
    return null;
  }

  if (data && data.voucher) {
    return data.voucher;
  }

  return null;
};


type Voucher = {
    id: string;
    index1: number;
    index: number;
    destination: string;
    input: any, //{index: number; epoch: {index: number; }
    payload: string;
    originalPayload: string;
    proof: any;
    executed: any;
    address: string | null;
    amount: string | null;
    buttonText: string;
};

export const useVouchers = () => {
    const client = useClient();
    const [result,reexecuteQuery] = useVouchersQuery()
    const [vouchers, setVouchers] = React.useState<Voucher[]>([]);
    const { data, fetching, error } = result;
    const rollups = useRollups(CartesiDAppAddress);
    const { wallets, ready } = useWallets();
    const currentAddress = useMemo(() => {
        return wallets[0]?.address;
    },[wallets, ready]);

    //Poll for vouchers
    useInterval(() =>{
        reexecuteQuery({requestPolicy: "network-only"});
    }, 1000);

    const getProof = async (voucher: Voucher) => {
        const voucherDetails = await fetchVoucherDetails(client, voucher.index, voucher.input.index);
        //console.log("voucherDetails", voucherDetails);
        if (voucherDetails && voucherDetails.proof) {
            return voucherDetails.proof;
        }
    };

    const wasExecuted = async (voucher: Voucher) => {
        if (rollups && !!voucher.proof) {
            return await rollups.dappContract.wasVoucherExecuted(BigNumber.from(voucher.input.index),BigNumber.from(voucher.index));
        }
        return null;
    }

    const executeVoucher = async (voucher: any) => {
        if (rollups && !!voucher.proof) {
    
            const newVoucherToExecute = {...voucher};
            try {
                const hasExecuted = await wasExecuted(voucher);
                if(hasExecuted) {
                    console.log("Voucher already executed");
                    return;
                }
                const tx = await rollups.dappContract.executeVoucher( voucher.destination,voucher.originalPayload,voucher.proof);
                const receipt = await tx.wait();
                console.log("Voucher executed", receipt);
                
            } catch (e) {
                newVoucherToExecute.msg = `COULD NOT EXECUTE VOUCHER: ${JSON.stringify(e)}`;
                console.log(`COULD NOT EXECUTE VOUCHER: ${JSON.stringify(e)}`);
            }
            //setVoucherToExecute(newVoucherToExecute);
            //Remove voucher from list
            //setVouchers(vouchers.filter((v) => v.index !== voucher.index && v.input.index !== voucher.input.index && v.payload !== voucher.payload));
    
        }
    }

    //Vouchers relevant to the current address that are not executed
    useEffect(() => {
        if (fetching) return;
        if (error) return;
        if (!data || !data.vouchers) return;

        const vouchers = data.vouchers.edges.map((node: any, index1: number) => {
            const n = node.node;
        
            let payload = n?.payload;
            let address = null;
            let inputPayload = n?.input.payload;
            let amount = "0";
            let buttonText = "Execute";
            if (inputPayload) {
                try {
                    inputPayload = ethers.utils.toUtf8String(inputPayload);
                } catch (e) {
                    inputPayload = inputPayload + " (hex)";
                }
            } else {
                inputPayload = "(empty)";
            }
            if (payload) {
                const decoder = new ethers.utils.AbiCoder();
                const selector = decoder.decode(["bytes4"], payload)[0]; 
                payload = ethers.utils.hexDataSlice(payload,4);
                try {
                    switch(selector) { 
                        case '0xa9059cbb': { 
                            // erc20 transfer; 
                            const decode = decoder.decode(["address","uint256"], payload);
                            payload = `Erc20 Transfer - Amount: ${ethers.utils.formatEther(decode[1])} - Address: ${decode[0]}`;
                            amount = ethers.utils.formatEther(decode[1]);
                            break; 
                        }
                        case '0x42842e0e': { 
                            //erc721 safe transfer;
                            const decode = decoder.decode(["address","address","uint256"], payload);
                            payload = `Erc721 Transfer - Id: ${decode[2]} - Address: ${decode[1]}`;
                            amount = ethers.utils.formatEther(decode[2]);
                            break; 
                        }
                        case '0x522f6815': { 
                            //ether transfer; 
                            const decode2 = decoder.decode(["address", "uint256"], payload)
                            payload = `Ether Transfer - Amount: ${ethers.utils.formatEther(decode2[1])} (Native eth) - Address: ${decode2[0]}`;
                            address = decode2[0];
                            amount = ethers.utils.formatEther(decode2[1]);
                            buttonText = `Withdraw ${amount} ETH`;
                            break; 
                        }
                        case '0xf242432a': { 
                            //erc155 single safe transfer;
                            const decode = decoder.decode(["address","address","uint256","uint256"], payload);
                            payload = `Erc1155 Single Transfer - Id: ${decode[2]} Amount: ${decode[3]} - Address: ${decode[1]}`;
                            break; 
                        }
                        case '0x2eb2c2d6': { 
                            //erc155 Batch safe transfer;
                            const decode = decoder.decode(["address","address","uint256[]","uint256[]"], payload);
                            payload = `Erc1155 Batch Transfer - Ids: ${decode[2]} Amounts: ${decode[3]} - Address: ${decode[1]}`;
                            break; 
                        }
                        case '0xd0def521': { 
                            //erc721 mint;
                            const decode = decoder.decode(["address","string"], payload);
                            payload = `Mint Erc721 - String: ${decode[1]} - Address: ${decode[0]}`;
                            break; 
                        }
                        case '0x755edd17': { 
                            //erc721 mintTo;
                            const decode = decoder.decode(["address"], payload);
                            payload = `Mint Erc721 - Address: ${decode[0]}`;
                            break; 
                        }
                        case '0x6a627842': { 
                            //erc721 mint;
                            const decode = decoder.decode(["address"], payload);
                            payload = `Mint Erc721 - Address: ${decode[0]}`;
                            break; 
                        }
                        default: {
                            break; 
                        }
                    }
                } catch (e) {
                    console.log(e);
                }
            } else {
                payload = "(empty)";
            }
            return {
                index1: index1,
                id: `${n?.id}`,
                index: parseInt(n?.index),
                destination: `${n?.destination ?? ""}`,
                originalPayload: `${n?.payload}`,
                payload: `${payload}`,
                input: n ? {index:n.input.index,payload: inputPayload} : {},
                proof: null,
                executed: null,
                address: address,
                amount: amount,
                buttonText: buttonText
            };
        }).sort((b: any, a: any) => {
            if (a.input.index === b.input.index) {
                return b.index - a.index;
            } else {
                return b.input.index - a.input.index;
            }
        }).filter((val)=>{
            //Make sure val.address === currentAddress
            return val.address?.toLowerCase() == currentAddress?.toLowerCase() && !val.executed;
        }).map((val, index) => {
            //add proof and executed to each voucher
            return {
                ...val,
                proof: getProof(val),
                executed: wasExecuted(val)
            };
        });

        const resolveVouchers = async () => {
            const vouchersWithProofAndExecuted = await Promise.all(vouchers.map(async (val) => {
                const proof = await getProof(val);
                const executed = await wasExecuted(val);
                if(!executed)
                    return {
                        ...val,
                        proof,
                        executed
                    };
                else return null;
            }));
        
            setVouchers(vouchersWithProofAndExecuted.filter((val) => val !== null));
            //console.log("vouchers", vouchersWithProofAndExecuted);
        };

        resolveVouchers();
    }, [currentAddress, data, fetching, error]);


    

    return {vouchers, executeVoucher };

}

export const usePendingWithdrawals = () => {
    const { vouchers, executeVoucher } = useVouchers();
    const [ executingIndexes, setExecutingIndexes ] = React.useState<number[]>([]);
    const { wallets, ready } = useWallets();
    const currentAddress = useMemo(()=> {
        return wallets[0]?.address;
    },[wallets, ready]);

    const pendingWithdrawals = useMemo(() => {
        console.log("vouchers found", vouchers);
        return vouchers.filter((val) => val.address?.toLowerCase() == currentAddress?.toLowerCase() && val.buttonText.includes("Withdraw"));
    }, [vouchers, currentAddress]);

    const executeWithdrawal = useCallback(async (index: number) => {
        const voucher = pendingWithdrawals[index];
        const alreadyExecuting = executingIndexes.includes(index);
        if(!alreadyExecuting && voucher) {
            setExecutingIndexes([...executingIndexes, index]);
            await executeVoucher(voucher);
            setExecutingIndexes(executingIndexes.filter((val) => val !== index));
        }
    }, [executeVoucher]);

    const isExecuting = useCallback((index: number) => {
        const voucher = pendingWithdrawals[index];
        return executingIndexes.includes(index) && voucher && !voucher?.executed;
    }, [executingIndexes]);

    const canExecute = useCallback((index: number) => {
        const voucher = pendingWithdrawals[index];
        return !executingIndexes.includes(index) && voucher && voucher?.proof && !voucher?.executed;
    }, [executingIndexes, pendingWithdrawals]);

    const isFinished = useCallback((index: number) => {
        const voucher = pendingWithdrawals[index];
        return voucher?.executed;
    }, [pendingWithdrawals]);


    return {pendingWithdrawals, executeWithdrawal, isExecuting, canExecute, isFinished};
}
    