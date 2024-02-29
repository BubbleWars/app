import { Input, InputType, Inspect, InspectType } from "../../../core/types/inputs.js";
import { Chain, createPublicClient, defineChain, hexToString, http } from 'viem'
import { CartesiDAppAddress } from "./contracts.js";
import { mainnet, localhost } from "viem/chains"
import { Snapshot } from "../../../core/types/state.js";
import { decodePacked } from "../../../core/funcs/utils.js";
import { ethers } from "ethers";

const ETH_DEPOSIT_FUNCTION_SELECTOR = ethers
    .keccak256(ethers.toUtf8Bytes("depositEther(address,uint256)"))

console.log("ETH_DEPOSIT_FUNCTION_SELECTOR", ETH_DEPOSIT_FUNCTION_SELECTOR)
const ETH_PORTAL_ADDRESS = "0xFfdbe43d4c855BF7e0f105c400A50857f53AB044";

const blockNumberToTimestamp: {[key: number]: number} = {}

//Inspect the state of the Cartesi Machine
export const inspectState = async (
    inspect: Inspect,
): Promise<Snapshot | undefined> => {
    const param = JSON.stringify(inspect);
    const url = `${process.env.INSPECTOR_URL}/${param}`;
    const response = await fetch(url);
    const json = await response.json();
    if (!json) return undefined;
    const payloadString = json?.reports[0]?.payload;
    if (!payloadString) return undefined;
    return JSON.parse(hexToString(payloadString)) as Snapshot;
};


export const currentChain = defineChain({
    id: 1_337,
    name: "bubblewars_anvil",
    network: "bubblewars_anvil",
    nativeCurrency: {
        decimals: 18,
        name: "Ether",
        symbol: "ETH",
    },
    rpcUrls: {
        default: { http: [process.env.RPC_URL] },
        public: { http: [process.env.RPC_URL] },
    },
});
 
export const publicClient = createPublicClient({
    chain: currentChain,
    transport: http(),
    pollingInterval: 10,
})

export const onInspect = async (callback: (snapshot: Snapshot) => void) => {
    const snapshot = await inspectState({ type: InspectType.State, value: 0 })
    console.log("snapshot", snapshot.portals)
    callback(snapshot)
}

export const onInput = (callback: (input: Input) => void) => {
    console.log("setting onInput")
    let pendingTransaction: `0x{string}`[] = []
    const unwatch = publicClient.watchPendingTransactions({ 
        onTransactions: (hashes: `0x{string}`[]) => {
            //console.log("pending transactions", hashes)
            hashes.forEach(async hash => {
                const transaction = await publicClient.waitForTransactionReceipt({
                    confirmations: 1,
                    hash,
                })

                const logs = transaction.logs

                if(logs.length == 0) return

                console.log("transaction", transaction)
                console.log("topics", logs[0]?.topics)
                const blockNumber = Number(transaction.blockNumber)
                let timestamp;
                if(blockNumberToTimestamp[blockNumber]){
                    timestamp = blockNumberToTimestamp[blockNumber]
                    console.log("timestamp from cache", timestamp)
                }
                else
                    Number((await publicClient.getBlock({blockNumber: transaction.blockNumber})).timestamp)


                if(transaction?.to?.toLowerCase() == ETH_PORTAL_ADDRESS.toLowerCase()) {
                    //Check if the transaction is a deposit
                    const data = '0x' + logs[0].data.substring(194, logs[0].data.length)
                    console.log("data", data)

                    const binary = decodePacked(["address", "uint256"], data)
                    console.log("binary", binary)
                    const address = binary[0]
                    const amount = binary[1]
                    console.log("is input", address, amount)
                    callback({
                        type: InputType.Deposit, 
                        timestamp,
                        sender: address,
                        amount 
                    })
                }
                else {
                     const data = logs[0].data
                    //from hex to string
                    
                    const json = hexToString(data)
                    const input: Input = JSON.parse(json.substring(json.indexOf('{'), json.lastIndexOf('}') + 1));
                    console.log("input", input)
                    callback({...input, timestamp, sender: transaction.from})
                }

                
                
                //Remove characters before the first '{' and after the last '}'
                
            })
        }
    })
}

export const onBlock = (callback: (block: number) => void) => {
    let blockTimestamp = 0
    const unwatch = publicClient.watchBlocks({
        onBlock: (block) => {
            const newBlockTimestamp = Number(block.timestamp)
            if (newBlockTimestamp > blockTimestamp) {
                blockTimestamp = newBlockTimestamp
                callback(blockTimestamp)

                blockNumberToTimestamp[Number(block.number)] = newBlockTimestamp
                if (Object.keys(blockNumberToTimestamp).length > 100) {
                    //Remove the oldest block
                    delete blockNumberToTimestamp[Object.keys(blockNumberToTimestamp)[0] as any]
                }
            }
        }
    })
}