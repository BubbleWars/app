import { useVouchersQuery, useVoucherQuery } from "@/generated-src/graphql"
import { BigNumber, ethers } from "ethers";
import React, { useMemo } from "react";
import { useEffect } from "react";
import { useRollups } from "./rollups";
import { CartesiDAppAddress } from "@/contracts";
import { useWallets } from "@privy-io/react-auth";
import { get } from "http";

type Voucher = {
    id: string;
    index1: number;
    index: number;
    destination: string;
    input: any, //{index: number; epoch: {index: number; }
    payload: string;
    proof: any;
    executed: any;
    address: string | null;
};

export const useVouchers = () => {
    const [result,reexecuteQuery] = useVouchersQuery();
    const [vouchers, setVouchers] = React.useState<Voucher[]>([]);
    const [voucherToFetch, setVoucherToFetch] = React.useState([0,0]);
    const [voucherResult,reexecuteVoucherQuery] = useVoucherQuery({
        variables: { voucherIndex: voucherToFetch[0], inputIndex: voucherToFetch[1] }//, pause: !!voucherIdToFetch
    });
    const [voucherToExecute, setVoucherToExecute] = React.useState<any>();
    const { data, fetching, error } = result;
    const rollups = useRollups(CartesiDAppAddress);

    const { wallets, ready } = useWallets();
    const currentAddress = useMemo(()=> {
        return wallets[0]?.address;
    },[wallets, ready]);

    const getProof = async (voucher: Voucher) => {
        setVoucherToFetch([voucher.index,voucher.input.index]);
        reexecuteVoucherQuery({ requestPolicy: 'network-only' });
    };


    const executeVoucher = async (voucher: any) => {
        if (rollups && !!voucher.proof) {

            const newVoucherToExecute = {...voucher};
            try {
                const tx = await rollups.dappContract.executeVoucher( voucher.destination,voucher.payload,voucher.proof);
                const receipt = await tx.wait();
                console.log(`voucher executed! (tx="${tx.hash}")`);
                newVoucherToExecute.msg = `voucher executed! (tx="${tx.hash}")`;
                if (receipt.events) {
                    newVoucherToExecute.msg = `${newVoucherToExecute.msg} - resulting events: ${JSON.stringify(receipt.events)}`;
                    newVoucherToExecute.executed = await rollups.dappContract.wasVoucherExecuted(BigNumber.from(voucher.input.index),BigNumber.from(voucher.index));
                }
                //set vouchers list with this voucher updated
                setVouchers(vouchers.map((v) => {
                    if (v.index1 === voucher.index1) {
                        return newVoucherToExecute;
                    } else {
                        return v;
                    }
                }));
            } catch (e) {
                newVoucherToExecute.msg = `COULD NOT EXECUTE VOUCHER: ${JSON.stringify(e)}`;
                console.log(`COULD NOT EXECUTE VOUCHER: ${JSON.stringify(e)}`);
            }
            //setVoucherToExecute(newVoucherToExecute);
            //Remove voucher from list
            //setVouchers(vouchers.filter((v) => v.index !== voucher.index && v.input.index !== voucher.input.index && v.payload !== voucher.payload));

        }
    }

    useEffect( () => {
        const setVoucher = async (voucher: any) => {
            console.log("updating voucher", voucher);
            if (rollups) {
                voucher.executed = await rollups.dappContract.wasVoucherExecuted(BigNumber.from(voucher.input.index),BigNumber.from(voucher.index));
                voucher.proof = voucher.proof ? voucher.proof : null;
                console.log("apply proof to voucher", voucher);
                //update vouchers
                setVouchers(vouchers.map((v) => {
                    if (v.index1 === voucher.index1) {
                        return voucher;
                    } else {
                        return v;
                    }
                }));
            }
        }
    
        if (!voucherResult.fetching && voucherResult.data){
            setVoucher(voucherResult.data.voucher);
        }
    },[voucherResult, rollups]);
    //console.log("voucherResult", voucherResult)
    
    //console.log(data)

    //Vouchers relevant to the current address that are not executed
    useEffect( ()=>{
        if (fetching) return;
        if (error) return;
        if (!data || !data.vouchers) return;
        setVouchers(data.vouchers.edges.map((node: any, index1: number) => {
        const n = node.node;
        let payload = n?.payload;
        let address = null;
        let inputPayload = n?.input.payload;
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
                        break; 
                    }
                    case '0x42842e0e': { 
                        //erc721 safe transfer;
                        const decode = decoder.decode(["address","address","uint256"], payload);
                        payload = `Erc721 Transfer - Id: ${decode[2]} - Address: ${decode[1]}`;
                        break; 
                    }
                    case '0x522f6815': { 
                        //ether transfer; 
                        const decode2 = decoder.decode(["address", "uint256"], payload)
                        payload = `Ether Transfer - Amount: ${ethers.utils.formatEther(decode2[1])} (Native eth) - Address: ${decode2[0]}`;
                        address = decode2[0];
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
            payload: `${payload}`,
            input: n ? {index:n.input.index,payload: inputPayload} : {},
            proof: null,
            executed: null,
            address: address
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
    }) ?? [])}, [currentAddress, data, fetching, error]);

    // //Automatically get proof for all vouchers
    // useEffect(()=>{
    //     vouchers.forEach((v) => {
    //         if (!v.proof) getProof(v);
    //     });
    // },[vouchers]);

    return {vouchers, getProof, executeVoucher, voucherToExecute};

}