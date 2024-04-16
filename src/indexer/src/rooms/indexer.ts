import {
    Input,
    InputType,
    Inspect,
    InspectType,
} from "../../../core/types/inputs.js";
import {
    Chain,
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

const ETH_DEPOSIT_FUNCTION_SELECTOR = ethers.keccak256(
    ethers.toUtf8Bytes("depositEther(address,uint256)"),
);

console.log("ETH_DEPOSIT_FUNCTION_SELECTOR", ETH_DEPOSIT_FUNCTION_SELECTOR);
const ETH_PORTAL_ADDRESS = "0xFfdbe43d4c855BF7e0f105c400A50857f53AB044";

const blockNumberToTimestamp: { [key: number]: number } = {};

let inputSet = false;
let inspectSet = false;
let blockSet = false;

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
});

export const onInspect = async (callback: (snapshot: Snapshot) => void) => {
    const snapshot = await inspectState({ type: InspectType.State, value: 0 });
    console.log("snapshot", snapshot);
    callback(snapshot);
};

export const onUser = async (callback: (users: UserSocialSchema[]) => void) => {
    const users = await fetchUsers();
    callback(users);
};

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
                    console.log("timestamp from cache", timestamp);
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
                    console.log("data", data);

                    const binary = decodePacked(["address", "uint256"], data);
                    console.log("binary", binary);
                    const address = binary[0];
                    const amount = binary[1];
                    console.log("Recieved transaction indexer.ts:", address, timestamp);
                    callback({
                        type: InputType.Deposit,
                        timestamp,
                        sender: address,
                        amount,
                    });
                } else {
                    try {
                        const data = logs[0].data;
                        //from hex to string
                        const json = hexToString(data);
                        console.log("json", json);
                        const input: Input = JSON.parse(
                            json.substring(
                                json.indexOf('{"'),
                                json.lastIndexOf("}") + 1,
                            ),
                        );
                        console.log("Recieved transaction indexer.ts:", transaction.from, timestamp);
                        callback({
                            ...input,
                            timestamp,
                            sender: transaction.from,
                        });
                    } catch (e) {
                        console.log("error", e);
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
    });
    return unwatch;
    blockSet = true;
};
