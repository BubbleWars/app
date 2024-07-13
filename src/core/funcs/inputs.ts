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
    PunctureInput,
    PayRent,
} from "../types/inputs";
import { ethers } from "ethers";
import {
    bubbles,
    currentState,
    nodes,
    obstacles,
    pendingInputs,
    portals,
    protocol,
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
    getPortalMass,
    getPortalResourceMass,
    portalEmitBubble,
    portalEmitResource,
} from "./portal";
import { decodePacked, massToRadius } from "./utils";
import { addPuncturePoint, emitBubble, emitResource, getBubbleEthMass, getBubbleResourceMass, setBubbleResourceMass } from "./bubble";
import { Vec2 } from "planck-js";
import {
    snapshotBubbles,
    snapshotCurrentState,
    snapshotNodes,
    snapshotPendingInputs,
    snapshotPortals,
    snapshotProtocol,
    snapshotResources,
    snapshotRun,
    snapshotTempTimestamp,
    snapshotUsers,
    snapshotWorld,
} from "../snapshots";
import { ResourceType } from "../types/resource";
import { resourceMassToAmount, updateResource } from "./resource";
import { AssetType, FeeType } from "../types/protocol";
import { addEvent } from "./events";
import { EventsType } from "../types/events";
import { getBodyId } from "./obstacle";
import { MAX_PORTAL_AMOUNT, MIN_PORTAL_DISTANCE, PORTAL_SPAWN_RADIUS, WORLD_RADIUS } from "../consts";

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

console.log("HTTP rollup_server url is " + rollup_server);

export const parseInput = (data: AdvanceData): Input | false => {
    //console.log("Received advance request data" + data);
    const payload = data.payload;
    const metadata = data?.metadata;
    const sender = metadata?.msg_sender;
    const timestamp = metadata?.timestamp;
    const blockNumber = metadata?.block_number;
    const inputIndex = metadata?.input_index;
    const epochIndex = metadata?.epoch_index;

   //console.log("Recieved payload: ", payload);

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
        case InputType.PayRent:
            return {
                type: InputType.PayRent,
                timestamp: timestamp,
                sender: sender,
                blockNumber: blockNumber,
                inputIndex: inputIndex,
                epochIndex: epochIndex,
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
    console.log("Handling input:", input);
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
        case InputType.PayRent:
            await handlePayRent(input, client);
            break;
    }
    if (!client) {
        //sendNotice(input);
        run(input.timestamp);
    } else snapshotRun(input.timestamp);

    return true;
};

const handlePayRent = async (input: PayRent, client: boolean): Promise<boolean> => {
    const w = client ? snapshotWorld : world;
    const p = client ? snapshotProtocol : protocol;
    const ps = client ? snapshotPortals : portals;
    const success = p.payRent(input.timestamp, w, input.sender, ps);
    return success;
}

const handleDeposit = (
    { sender, amount, timestamp }: Deposit,
    client: boolean,
): boolean => {
    const user = getUser(sender, client);
    user.balance += amount;
    
    //Check if user has a portal
    const userPortal = client
        ? Array.from(snapshotPortals.values()).filter(
              (portal) => portal.owner === user.address,
          )
        : Array.from(portals.values()).filter(
              (portal) => portal.owner === user.address,
          );
    
    if(userPortal.length > 0){
        handleAddEthToPortal(sender, amount, client)

    }else{
        handleSpawnPortal(
            { type: InputType.SpawnPortal, timestamp, sender, mass: amount },
            client,
        );
    }   
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

export const withdrawEth = async (address: Address, amount: number): Promise<boolean> => {
    const voucher_request = await fetch(rollup_server + "/voucher", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            destination: address,
            payload: ETH_WITHDRAW_FUNCTION_SELECTOR + ethers.AbiCoder.defaultAbiCoder().encode(
                ["address", "uint256"],
                [address, amount],
            ),
        }),
    });

    if (voucher_request.status != 200) {
        return false;
    }

    return true;
}

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
        const amountAfterFees = snapshotProtocol.processFee(FeeType.SPAWN, AssetType.ETH, amount);
        const radius = massToRadius(amountAfterFees);
        const spawnPoint = generateSpawnPoint(snapshotWorld, radius, MIN_PORTAL_DISTANCE, PORTAL_SPAWN_RADIUS, WORLD_RADIUS);
        if (!spawnPoint) {
            console.log("Failed to generate portal spawn point");
            return false;
        }
        const isMaxPortal = snapshotPortals.size >= MAX_PORTAL_AMOUNT;
        if(isMaxPortal){
            console.log("Max portal amount reached");
            return false;
        }
        createPortal(
            snapshotPortals,
            snapshotWorld,
            user.address,
            spawnPoint.x,
            spawnPoint.y,
            amountAfterFees,
        );

        //Emit event
        addEvent({
            type: EventsType.SpawnPortal,
            portalId: user.address,
            userAddress: user.address,
            amount: amountAfterFees,
            blockNumber: input.blockNumber,
            timestamp: input.timestamp,
            hash: "0",
            sender: user.address,
        })
    } else {
        const amountAfterFees = protocol.processFee(FeeType.SPAWN, AssetType.ETH, amount);
        const radius = massToRadius(amountAfterFees);
        const spawnPoint = generateSpawnPoint(world, radius, MIN_PORTAL_DISTANCE, PORTAL_SPAWN_RADIUS, WORLD_RADIUS);
        if (!spawnPoint) {
            console.log("Failed to generate portal spawn point");
            return false;
        }
        const isMaxPortal = portals.size >= MAX_PORTAL_AMOUNT;
        if(isMaxPortal){
            console.log("Max portal amount reached");
            return false;
        }
        createPortal(portals, world, user.address, spawnPoint.x, spawnPoint.y, amountAfterFees);

        //Emit event
        addEvent({
            type: EventsType.SpawnPortal,
            portalId: user.address,
            userAddress: user.address,
            amount: amountAfterFees,
            blockNumber: input.blockNumber,
            timestamp: input.timestamp,
            hash: "0",
            sender: user.address,
        })
    }
    

    return true;
};

const handleAddEthToPortal = (portalId: string, amount: number, client: boolean): boolean => {
    const portal = client
        ? snapshotPortals.get(portalId.toLowerCase())
        : portals.get(portalId.toLowerCase());
    if (!portal) return false;
    if (client) {
        const amountAfterFees = snapshotProtocol.processFee(FeeType.SPAWN, AssetType.ETH, amount);
        portal.mass += amountAfterFees;
    } else {
        const amountAfterFees = protocol.processFee(FeeType.SPAWN, AssetType.ETH, amount);
        portal.mass += amountAfterFees;
    }
    return true;
}

const handleEmit = (input: Emit, client: boolean): boolean => {
    //console.log("Handling emit with input:", JSON.stringify(input));
    //console.log("Portals:", JSON.stringify(portals));
    //console.log(portals)
    //console.log("Bubbles:", JSON.stringify(bubbles));
    //console.log(bubbles)
    //console.log(pendingInputs)
    //console.log(currentState)
    const mainSnapshotPortal = snapshotPortals;
    const mainSnapshotBubble = snapshotBubbles;
    const mainPortals = portals;
    const mainBubbles = bubbles;
    const isPortal = client
        ? snapshotPortals.has(input.from.toLowerCase())
        : portals.has(input.from.toLowerCase());
    const isBubble = client
        ? snapshotBubbles.has(input.from.toLowerCase())
        : bubbles.has(input.from.toLowerCase());

    if (!isPortal && !isBubble) {
       //console.log("Input from is not a portal or bubble");
       //console.log("Bubbles", JSON.stringify(bubbles));
       //console.log("Portals", JSON.stringify(portals));
        return false;
    }
    if (!input?.timestamp) {
       //console.log("Input timestamp is undefined");
        return false;
    }
    if (!input?.sender) {
        //console.log("Input sender is undefined");
        return false;
    }
    if (!input?.executionTime) input.executionTime = input.timestamp;
    if (input?.executionTime < input?.timestamp) return false;

    if(input?.mass <= 0){ 
       //console.log("Input mass is less than or equal to 0");
        return false;
    }
    const user = getUser(input.sender, client);

    if (isPortal) {
        const portal = client
            ? snapshotPortals.get(input.from.toLowerCase())
            : portals.get(input.from.toLowerCase());
        
        const totalMass = input.emissionType == "bubble" ? 
            getPortalMass(portal) : 
            getPortalResourceMass(portal, input.emissionType);

        if (!portal) {
            //console.log("Portal not found");
            return false;
        }

        if (portal.owner.toLowerCase() !== user.address.toLowerCase()) {
            //console.log("Portal owner is not user");
            return false;
        }
        if (totalMass < input.mass) {
            //console.log("Portal mass is less than input mass");
            return false;
        }
    } else if (isBubble) {
        const bubble = client
            ? snapshotBubbles.get(input.from.toLowerCase())
            : bubbles.get(input.from.toLowerCase());
        
        const totalMass = input.emissionType == "bubble" ?
            getBubbleEthMass(bubble) :
            getBubbleResourceMass(bubble, input.emissionType);
        
        if (!bubble) {
            //console.log("Bubble not found");
            return false;
        }
        if (bubble.owner.toLowerCase() !== user.address.toLowerCase()) {
            //console.log("Bubble owner is not user");
            return false;
        }
        if (totalMass < input.mass) {
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
                console.log("Request sent. Status:", JSON.stringify(currentState));
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
    //console.log("Handling pending input:", input, "snapshot:", client);
    const { type } = input;
    switch (type) {
        case InputType.Emit:
            if (client) handlePendingClientEmit(input);
            else handlePendingEmit(input);
            break;
        case InputType.Puncture:
            if(client) handlePendingClientPuncture(input);
            else handlePendingPuncture(input);
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
        else
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
        else
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
        else
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
        else
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

export const handlePendingPuncture = (input: PunctureInput): void => {
    const bubble = bubbles.get(input.bubbleId.toLowerCase());
    if (!bubble ) return;
    const puncturePoint = { x: input.puncturePoint.x, y: input.puncturePoint.y };
    const amount = input.amount;
    const timestamp = tempTimestamp;
  
    //console.log("CREATING PUNCTURE AMOUNT: ", punctureAmount);
    addPuncturePoint(
        bubble, 
        {x: puncturePoint.x, y:puncturePoint.y}, 
        amount,
        timestamp
    );

}

export const handlePendingClientPuncture = (input: PunctureInput): void => {
    const bubble = snapshotBubbles.get(input.bubbleId.toLowerCase());
    if (!bubble) return;
    const puncturePoint = { x: input.puncturePoint.x, y: input.puncturePoint.y };
    const amount = input.amount;
    const timestamp = snapshotTempTimestamp;

    //console.log("CREATING PUNCTURE AMOUNT: ", punctureAmount);
    addPuncturePoint(
        bubble, 
        {x: puncturePoint.x, y:puncturePoint.y}, 
        amount,
        timestamp
    );

    
}
