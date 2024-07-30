import {
    Input,
    InputType,
    Inspect,
    InspectType,
} from "../../../core/types/inputs.js";
import {
    Chain,
    Client,
    createClient,
    createPublicClient,
    defineChain,
    hexToString,
    http,
} from "viem";
import { CartesiDAppAddress } from "./contracts.js";
import { mainnet, localhost } from "viem/chains";
import { Snapshot } from "../../../core/types/state.js";
import { decodePacked } from "../../../core/funcs/utils.js";
import { ethers } from "ethers";
import { UserSocialSchema } from "./schema/WorldState.js";
import { fetchUsers } from "./privyApi.js";
import { rpc } from "viem/utils";

const ETH_DEPOSIT_FUNCTION_SELECTOR = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes("depositEther(address,uint256)"),
);

console.log("ETH_DEPOSIT_FUNCTION_SELECTOR", ETH_DEPOSIT_FUNCTION_SELECTOR);
const ETH_PORTAL_ADDRESS = process.env.CARTESI_CONTRACTS_APPLICATION_ADDRESS ??
    "0xFfdbe43d4c855BF7e0f105c400A50857f53AB044";
const INPUT_BOX_ADDRESS =  process.env.CARTESI_CONTRACTS_INPUT_BOX_ADDRESS ??
    "0x59b22D57D4f067708AB0c00552767405926dc768";

const blockNumberToTimestamp: { [key: number]: number } = {};

let inputSet = false;
let inspectSet = false;
let blockSet = false;

const inspector_url = process.env.INSPECTOR_URL ?? "http://localhost:8080/inspect"

console.log("portal address", ETH_PORTAL_ADDRESS);
console.log("input box address", INPUT_BOX_ADDRESS);
console.log("inspector url", inspector_url);

//Inspect the state of the Cartesi Machine
export const inspectState = async (
    inspect: Inspect,
): Promise<Snapshot | undefined> => {
    try {
        console.log("inspector url", inspector_url);
        const param = JSON.stringify(inspect);
        const url = `${inspector_url}/${param}`;
        console.log("inspect url", url);
        const response = await fetch(url);
        const json = await response.json();
        if (!json) return undefined;
        const payloadString = json?.reports[0]?.payload;
        if (!payloadString) return undefined;
        return JSON.parse(hexToString(payloadString)) as Snapshot;
    }
    catch (e) {
        console.log("error inspecting state", e);
        return { timestamp: 0} as any
    }
};

const rpcUrl = process.env.RPC_HTTP_ENDPOINT ?? "http://localhost:8545";
const chainId = process.env.CARTESI_BLOCKCHAIN_ID ?? 1_337;

export const currentChain = defineChain({
    id: chainId as number,
    name: "bubblewars_anvil",
    network: "bubblewars_anvil",
    nativeCurrency: {
        decimals: 18,
        name: "Ether",
        symbol: "ETH",
    },
    rpcUrls: {
        default: { http: [rpcUrl] },
        public: { http: [rpcUrl] },
    },
});

export const publicClient = createPublicClient({
    chain: currentChain,
    transport: http(),
    pollingInterval: 1000,
});


    
export const onInspect = async (callback: (snapshot: Snapshot) => void) => {
    let snapshot = await inspectState({ type: InspectType.State, value: 0 });
    while (!snapshot || snapshot.timestamp <= 0) {
        snapshot = await inspectState({ type: InspectType.State, value: 0 });
        await new Promise((resolve) => setTimeout(resolve, 10000));
    }
   console.log("snapshot", snapshot);
    callback(snapshot);
};

export const onUser = async (callback: (users: UserSocialSchema[]) => void) => {
    setInterval(async () => {
        const users = await fetchUsers();
        callback(users);
    }, 10000);
};

// Function to increase the EVM time
export const increaseEvmTime = async (seconds: number) => {
    try {
        const response = await publicClient.request({
            method: 'evm_increaseTime',
            params: [seconds],
          });
      console.log('Time increased by:', seconds, 'seconds');
      return response;
    } catch (error) {
      console.error('Error increasing EVM time:', error);
    }
}

const contract_address = process.env.CARTESI_CONTRACTS_INPUT_BOX_ADDRESS ?? "0x59b22D57D4f067708AB0c00552767405926dc768";
export const onInput = (callback: (input: Input) => void) => {
    let pendingTransaction: `0x{string}`[] = [];
    const unwatch = publicClient.watchPendingTransactions({
        onTransactions: (hashes: `0x{string}`[]) => {
            //console.log("pending transactions", hashes)
            hashes.forEach(async (hash) => {
                const transaction =
                    await publicClient.waitForTransactionReceipt({
                        confirmations: 1,
                        hash,
                    });

                const logs = transaction.logs;

                if (logs.length == 0) return;

                //console.log("transaction", transaction);
                //console.log("topics", logs[0]?.topics);
                const blockNumber = Number(transaction.blockNumber);
                let timestamp;
                if (blockNumberToTimestamp[blockNumber]) {
                    timestamp = blockNumberToTimestamp[blockNumber];
                   //console.log("timestamp from cache", timestamp);
                } else
                    timestamp = Number(
                        (
                            await publicClient.getBlock({
                                blockNumber: transaction.blockNumber,
                            })
                        ).timestamp,
                    );

                if (
                    transaction?.to?.toLowerCase() ==
                    ETH_PORTAL_ADDRESS.toLowerCase()
                ) {
                    //Check if the transaction is a deposit
                    const data =
                        "0x" + logs[0].data.substring(194, logs[0].data.length);
                    //console.log("data", data);

                    const binary = decodePacked(["address", "uint256"], data);
                    //console.log("binary", binary);
                    const address = binary[0];
                    const amount = binary[1];
                   //console.log("Recieved transaction indexer.ts:", address, timestamp);
                    callback({
                        type: InputType.Deposit,
                        timestamp,
                        sender: address,
                        amount,
                    });
                } else if (transaction?.to?.toLowerCase() == INPUT_BOX_ADDRESS.toLowerCase()) {
                    try {
                        const data = logs[0].data;
                        //from hex to string
                        const json = hexToString(data);
                       //console.log("json", json);
                        const input: Input = JSON.parse(
                            json.substring(
                                json.indexOf('{"'),
                                json.lastIndexOf("}") + 1,
                            ),
                        );
                       //console.log("Recieved transaction indexer.ts:", transaction.from, timestamp);
                        callback({
                            ...input,
                            timestamp,
                            sender: transaction.from,
                        });
                    } catch (e) {
                       //console.log("error", e);
                    }
                }

                //Remove characters before the first '{' and after the last '}'
            });
        },
    });
    return unwatch;
    inspectSet = true;
};

export const onBlock = (callback: (block: number) => void) => {
    let blockTimestamp = 0;
    const unwatch = publicClient.watchBlocks({
        onBlock: (block) => {
            const newBlockTimestamp = Number(block.timestamp);
            if (newBlockTimestamp > blockTimestamp) {
                blockTimestamp = newBlockTimestamp;
                callback(blockTimestamp);

                blockNumberToTimestamp[Number(block.number)] =
                    newBlockTimestamp;
                if (Object.keys(blockNumberToTimestamp).length > 100) {
                    // Convert keys to numbers, sort them, and get the smallest (oldest) key
                    const oldestKey = Object.keys(blockNumberToTimestamp)
                        .map(Number) // Convert keys to numbers
                        .sort((a, b) => a - b)[0]; // Sort numerically and get the first element

                    // Remove the oldest block
                    delete blockNumberToTimestamp[oldestKey];
                }
                
            }

        },
        emitMissed: true,
    });
    return unwatch;
    blockSet = true;
};
function createHttpTransport(arg0: string): any {
    throw new Error("Function not implemented.");
}

