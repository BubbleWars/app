import {
    AdvanceData,
    Emit,
    Input,
    InputType,
    SpawnPortal,
    Deposit,
    Withdraw,
    InspectData,
    Inspect,
    InspectType,
} from "../types/inputs";
import { ethers } from "ethers";
import {
    bubbles,
    currentState,
    nodes,
    obstacles,
    pendingInputs,
    portals,
    resources,
    run,
    tempTimestamp,
    users,
    world,
} from "../world";
import { Address } from "../types/address";
import { User } from "../types/user";
import {
    createPortal,
    generateSpawnPoint,
    portalEmitBubble,
    portalEmitResource,
} from "./portal";
import { decodePacked } from "./utils";
import { emitBubble, emitResource } from "./bubble";
import { Vec2 } from "planck-js";
import {
    snapshotBubbles,
    snapshotNodes,
    snapshotPendingInputs,
    snapshotPortals,
    snapshotResources,
    snapshotRun,
    snapshotTempTimestamp,
    snapshotUsers,
    snapshotWorld,
} from "../snapshots";
import { ResourceType } from "../types/resource";

const isNode =
    typeof process !== "undefined" &&
    process.versions != null &&
    process.versions.node != null;
const rollup_server = isNode
    ? process.env.ROLLUP_HTTP_SERVER_URL ?? "http://localhost:3000"
    : "http://localhost:3000";
const ETH_PORTAL_ADDRESS = "0xFfdbe43d4c855BF7e0f105c400A50857f53AB044";
const ETH_WITHDRAW_FUNCTION_SELECTOR = ethers
    .keccak256(ethers.toUtf8Bytes("withdrawEther(address,uint256)"))
    .slice(0, 4);

export const parseInput = (data: AdvanceData): Input | false => {
    //console.log("Received advance request data" + data);
    const payload = data.payload;
    const metadata = data?.metadata;
    const sender = metadata?.msg_sender;
    const timestamp = metadata?.timestamp;
    const blockNumber = metadata?.block_number;
    const inputIndex = metadata?.input_index;
    const epochIndex = metadata?.epoch_index;

    console.log("Recieved payload: ", payload);

    if (sender.toLowerCase() == ETH_PORTAL_ADDRESS.toLowerCase()) {
        const binary = decodePacked(["address", "uint256"], payload);
        const address = binary[0];
        const amount = Number(binary[1]);
        return {
            type: InputType.Deposit,
            timestamp: timestamp,
            sender: address,
            blockNumber: blockNumber,
            inputIndex: inputIndex,
            epochIndex: epochIndex,
            amount: amount,
        };
    }
    const payloadString = ethers.toUtf8String(payload);
    const payloadJSON = JSON.parse(payloadString);
    const type =
        sender == ETH_PORTAL_ADDRESS ? InputType.Deposit : payloadJSON.type;

    switch (type) {
        default:
            return false;
        case InputType.SpawnPortal:
            return {
                type: InputType.SpawnPortal,
                timestamp: timestamp,
                sender: sender,
                blockNumber: blockNumber,
                inputIndex: inputIndex,
                epochIndex: epochIndex,
                mass: payloadJSON.mass,
            };
        case InputType.Emit:
            return {
                type: InputType.Emit,
                timestamp: timestamp,
                sender: sender,
                blockNumber: blockNumber,
                inputIndex: inputIndex,
                epochIndex: epochIndex,
                executionTime: payloadJSON.executionTime ?? timestamp,
                from: payloadJSON.from,
                mass: payloadJSON.mass,
                emissionType: payloadJSON.emissionType ?? "bubble",
                direction: payloadJSON.direction,
            };
        case InputType.Withdraw:
            return {
                type: InputType.Withdraw,
                timestamp: timestamp,
                sender: sender,
                blockNumber: blockNumber,
                inputIndex: inputIndex,
                epochIndex: epochIndex,
                amount: payloadJSON.amount,
            };
    }
};

//create a user and add it to the users map if doesn't exist
export const getUser = (address: Address, client: boolean): User => {
    const user = client
        ? snapshotUsers.get(address.toLowerCase())
        : users.get(address.toLowerCase());
    if (user) {
        return user;
    } else {
        const newUser: User = {
            address: address,
            balance: 0,
        };
        client
            ? snapshotUsers.set(address, newUser)
            : users.set(address, newUser);
        return newUser;
    }
};

export const handleInput = async (
    input: Input | undefined,
    client: boolean = false,
): Promise<boolean> => {
    if (!input) return false;
    const type = input.type;
    switch (type) {
        case InputType.Emit:
            handleEmit(input, client);
            break;
        case InputType.SpawnPortal:
            handleSpawnPortal(input, client);
            break;
        case InputType.Deposit:
            handleDeposit(input, client);
            break;
        case InputType.Withdraw:
            await handleWithdraw(input, client);
            break;
    }
    if (!client) {
        //sendNotice(input);
        run(input.timestamp);
    } else snapshotRun(input.timestamp);

    return true;
};

const handleDeposit = (
    { sender, amount, timestamp }: Deposit,
    client: boolean,
): boolean => {
    const user = getUser(sender, client);
    user.balance += amount;
    handleSpawnPortal(
        { type: InputType.SpawnPortal, timestamp, sender, mass: amount },
        client,
    );
    return true;
};

const handleWithdraw = async (
    input: Withdraw,
    client: boolean,
): Promise<boolean> => {
    const user = getUser(input.sender, client);
    const amount = input.amount;
    if (user.balance < amount) {
        return false;
    } else {
        user.balance -= amount;
        const voucher_request = await fetch(rollup_server + "/voucher", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                destination: ETH_PORTAL_ADDRESS,
                payload:
                    ETH_WITHDRAW_FUNCTION_SELECTOR +
                    ethers.AbiCoder.defaultAbiCoder().encode(
                        ["address", "uint256"],
                        [input.sender, amount],
                    ),
            }),
        });

        if (voucher_request.status != 200) {
            return false;
        }

        return true;
    }
};

const handleSpawnPortal = (input: SpawnPortal, client: boolean): boolean => {
    const user = getUser(input.sender, client);
    const amount = input.mass;

    //Check if user has enough balance/mass to spawn portal
    if (user.balance < amount) {
        return false;
    }

    //Check if user already has a portal, user can only have 1 portal
    const userPortal = client
        ? Array.from(snapshotPortals.values()).filter(
              (portal) => portal.owner === user.address,
          )
        : Array.from(portals.values()).filter(
              (portal) => portal.owner === user.address,
          );

    if (userPortal.length > 0) {
        return false;
    }

    //Create portal
    user.balance -= amount;
    if (client) {
        const { x, y } = generateSpawnPoint(
            input.timestamp,
            snapshotWorld,
            snapshotPortals,
            snapshotBubbles,
            snapshotNodes,
            amount,
        );
        createPortal(
            snapshotPortals,
            snapshotWorld,
            user.address,
            x,
            y,
            amount,
        );
    } else {
        const { x, y } = generateSpawnPoint(
            input.timestamp,
            world,
            portals,
            bubbles,
            nodes,
            amount,
        );
        createPortal(portals, world, user.address, x, y, amount);
    }

    return true;
};

const handleEmit = (input: Emit, client: boolean): boolean => {
    //console.log("Handling emit with input:", JSON.stringify(input));
    //console.log("Portals:", JSON.stringify(portals));
    //console.log(portals)
    //console.log("Bubbles:", JSON.stringify(bubbles));
    //console.log(bubbles)
    //console.log(pendingInputs)
    //console.log(currentState)
    const isPortal = client
        ? snapshotPortals.has(input.from.toLowerCase())
        : portals.has(input.from.toLowerCase());
    const isBubble = client
        ? snapshotBubbles.has(input.from.toLowerCase())
        : bubbles.has(input.from.toLowerCase());

    if (!isPortal && !isBubble) {
        console.log("Input from is not a portal or bubble");
        console.log("Bubbles", JSON.stringify(bubbles));
        console.log("Portals", JSON.stringify(portals));
        return false;
    }
    if (!input?.timestamp) {
        console.log("Input timestamp is undefined");
        return false;
    }
    if (!input?.sender) {
        //console.log("Input sender is undefined");
        return false;
    }
    if (!input?.executionTime) input.executionTime = input.timestamp;
    if (input?.executionTime < input?.timestamp) return false;

    if(input?.mass <= 0){ 
        console.log("Input mass is less than or equal to 0");
        return false;
    }
    const user = getUser(input.sender, client);

    if (isPortal) {
        const portal = client
            ? snapshotPortals.get(input.from.toLowerCase())
            : portals.get(input.from.toLowerCase());
        if (!portal) {
            //console.log("Portal not found");
            return false;
        }

        if (portal.owner.toLowerCase() !== user.address.toLowerCase()) {
            //console.log("Portal owner is not user");
            return false;
        }
        if (portal.mass <= input.mass) {
            //console.log("Portal mass is less than input mass");
            return false;
        }
    } else if (isBubble) {
        const bubble = client
            ? snapshotBubbles.get(input.from.toLowerCase())
            : bubbles.get(input.from.toLowerCase());
        if (!bubble) {
            //console.log("Bubble not found");
            return false;
        }
        if (bubble.owner.toLowerCase() !== user.address.toLowerCase()) {
            //console.log("Bubble owner is not user");
            return false;
        }
        if (bubble.body.getMass() <= input.mass) {
            //console.log("Bubble mass is less than input mass");
            return false;
        }
    }

    if (client) {
        snapshotPendingInputs.push(input);
        snapshotPendingInputs.sort(
            (a, b) => a?.executionTime - b?.executionTime,
        );
    } else {
        pendingInputs.push(input);
        pendingInputs.sort((a, b) => a?.executionTime - b?.executionTime);
    }
    return true;
};

export const parseInspect = (data: InspectData): Inspect | false => {
    const payload = data.payload;
    const payloadString = ethers.toUtf8String(payload);
    return JSON.parse(payloadString) as Inspect;
};

export const handleInspect = async (inspect: Inspect): Promise<boolean> => {
    const { type } = inspect;
    let inspect_request;

    //console.log("Handling inspect request with type:", type);

    switch (type) {
        case InspectType.State:
            //console.log("InspectType is State, preparing request with currentState");
            try {
                inspect_request = await fetch(rollup_server + "/report", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        payload: ethers.hexlify(
                            ethers.toUtf8Bytes(JSON.stringify(currentState)),
                        ),
                    }),
                });
                //console.log("Request sent. Status:", inspect_request.status);
                //console.log("Request response:");
                //console.log(inspect_request);
                //console.log("Request response:", JSON.stringify(inspect_request));
                const responseText = await inspect_request.text();
                //console.log("Request response text:", responseText);
            } catch (error) {
                console.error(
                    "Error during fetch for InspectType State:",
                    error,
                );
                return false;
            }
            break;

        default:
            //console.log("Invalid InspectType, sending error payload");
            try {
                inspect_request = await fetch(rollup_server + "/report", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ error: "invalid inspect type" }),
                });
                //console.log("Error request sent. Status:", inspect_request.status);
            } catch (error) {
                console.error("Error during fetch for default case:", error);
                return false;
            }
    }

    if (!inspect_request.ok) {
        console.error("Request failed with status:", inspect_request.status);
    }

    return inspect_request.status !== 200;
};

export const sendNotice = async (input: Input): Promise<boolean> => {
    const notice_request = await fetch(rollup_server + "/notice", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            payload: ethers.hexlify(ethers.toUtf8Bytes(JSON.stringify(input))),
        }),
    });

    if (!notice_request.ok) {
        console.error("Request failed with status:", notice_request.status);
    }

    return notice_request.status !== 200;
};

export const handlePendingInputs = (
    input: Input,
    client: boolean = false,
): void => {
    console.log("Handling pending input:", input);
    const { type } = input;
    switch (type) {
        case InputType.Emit:
            if (client) handlePendingClientEmit(input);
            else handlePendingEmit(input);
            break;
    }
};

export const handlePendingEmit = (input: Emit): void => {
    //console.log("Handling pending emit with input:", JSON.stringify(input));
    const isPortal = portals.has(input.from.toLowerCase());
    const isBubble = bubbles.has(input.from.toLowerCase());
    if (!isPortal && !isBubble) return;
    const emissionType = input?.emissionType;
    const timestamp = tempTimestamp;
    if (isPortal) {
        const portal = portals.get(input.from.toLowerCase());
        if (!portal) return;
        if (emissionType == "bubble")
            portalEmitBubble(
                timestamp,
                bubbles,
                portal,
                input.mass,
                Vec2(input.direction.x, input.direction.y),
            );
        else if (emissionType == ResourceType.Energy)
            portalEmitResource(
                timestamp,
                portals,
                world,
                resources,
                portal,
                emissionType,
                input.mass,
                Vec2(input.direction.x, input.direction.y),
            );
    } else if (isBubble) {
        const bubble = bubbles.get(input.from.toLowerCase());
        if (!bubble) return;
        if (emissionType == "bubble")
            emitBubble(
                timestamp,
                bubbles,
                bubble,
                input.mass,
                Vec2(input.direction.x, input.direction.y),
            );
        else if (emissionType == ResourceType.Energy)
            emitResource(
                timestamp,
                world,
                bubbles,
                resources,
                bubble,
                emissionType,
                input.mass,
                Vec2(input.direction.x, input.direction.y),
            );
    }
};

export const handlePendingClientEmit = (input: Emit): void => {
    //console.log("Handling pending emit with input:", JSON.stringify(input));
    const isPortal = snapshotPortals.has(input.from.toLowerCase());
    const isBubble = snapshotBubbles.has(input.from.toLowerCase());
    if (!isPortal && !isBubble) return;
    const emissionType = input?.emissionType;
    const timestamp = snapshotTempTimestamp;
    if (isPortal) {
        const portal = snapshotPortals.get(input.from.toLowerCase());
        if (!portal) return;
        if (emissionType == "bubble")
            portalEmitBubble(
                timestamp,
                snapshotBubbles,
                portal,
                input.mass,
                Vec2(input.direction.x, input.direction.y),
            );
        else if (emissionType == ResourceType.Energy)
            portalEmitResource(
                timestamp,
                snapshotPortals,
                snapshotWorld,
                snapshotResources,
                portal,
                emissionType,
                input.mass,
                Vec2(input.direction.x, input.direction.y),
            );
    } else if (isBubble) {
        const bubble = snapshotBubbles.get(input.from.toLowerCase());
        if (!bubble) return;
        if (emissionType == "bubble")
            emitBubble(
                timestamp,
                snapshotBubbles,
                bubble,
                input.mass,
                Vec2(input.direction.x, input.direction.y),
            );
        else if (emissionType == ResourceType.Energy)
            emitResource(
                timestamp,
                snapshotWorld,
                snapshotBubbles,
                snapshotResources,
                bubble,
                emissionType,
                input.mass,
                Vec2(input.direction.x, input.direction.y),
            );
    }
};
