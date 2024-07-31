import { World } from "planck-js";
import { generateResources } from "../funcs/resource";
import { nodes } from "../world";
import { Address } from "./address";
import { Bubble } from "./bubble";
import { InputWithExecutionTime } from "./inputs";
import { Obstacle, ObstacleGroup } from "./obstacle";
import { Portal } from "./portal";
import { Resource, ResourceNode, ResourceType } from "./resource";
import { User } from "./user";
import { ProtocolState } from "./state";
import { createPortal, destroyPortal, generateSpawnPoint, getPortalMass, getPortalResourceMass, setPortalResourceMass } from "../funcs/portal";
import { massToRadius } from "../funcs/utils";
import { MIN_PORTAL_DISTANCE, PLANCK_MASS, PORTAL_SPAWN_RADIUS, WORLD_RADIUS } from "../consts";
import { addEvent } from "../funcs/events";
import { EventsType } from "./events";
import { withdrawEth } from "../funcs/inputs";
import { destroyBubble, getBubbleEthMass } from "../funcs/bubble";

//Protocol revenue split
const BUYBACK_PERCENTAGE = 0.5;
const FARMER_PERCENTAGE = 0.5;

export enum AssetType {
    ETH = "ETH",
    ENERGY = "ENERGY",
}

export enum FeeType {
    SPAWN = 10,
    TRADE = 2.5,
    BORDER = 10,  
}

export class Protocol {
    //Constants
    maxPoints: number = 100; // Max amount of Points the protocol can have at any time
    spawnAmount: number = 5; // Max amount of Points to spawn per cycle
    cycle: number = 600; // Should run every 100s

    //State
    last: number = 0; // Last time the protocol was run
    balance: Map<AssetType, number> = new Map<AssetType, number>(); // Balance of the protocol

    deposit(type: AssetType, amount: number) { 
       console.log("Depositing", type, amount);
        if(type == AssetType.ETH) {
            this.addBalance(type, amount);
        }
    }
    withdraw(type: AssetType, amount: number) { 
        //console.log("Withdrawing", type, amount);
        const balance = this.getBalance(type);
        if(balance < amount) {
            console.log("Not enough balance to withdraw", type, amount);
            return false;
        }
        this.addBalance(type, -amount);
        return true;
    }
    processFee(type: FeeType, asset: AssetType, amount: number) {
        const feeTypeAsString = FeeType[type];
       //console.log("Processing fee", feeTypeAsString, "for", amount, asset);
        const fee = amount * type / 100;
        this.deposit(asset, fee);

        //Call event
        addEvent({
            type: EventsType.ProtocolRevenue,
            timestamp: 0,
            amount: fee,
            from: type,
            blockNumber: 0,
        });

        return amount - fee;
    }

    getBalance(type: AssetType) {
        return this.balance.get(type);
    }

    addBalance(type: AssetType, amount: number) {
       //console.log("Adding balance", type, amount);
        const balance = this.getBalance(type);
        if(balance) this.balance.set(type, balance + amount);
        else this.balance.set(type, amount);
    }

    kickPortal(
        timestamp: number,
        world: World,
        portalId: Address,
        portals: Map<Address, Portal>,
        protocol: Protocol,
    ){
        const portal = portals.get(portalId);
        if(!portal){
            console.log("Portal not found");
            return false;
        }

        //Withdraw ETH from portal
        const portalEthBalance = getPortalMass(portal);
        withdrawEth(portalId, portalEthBalance);

        //Destroy portal
        destroyPortal(portals, portal);

        //Call event
        addEvent({
            type: EventsType.ProtocolKickPortal,
            timestamp,
            portalId,
            blockNumber: 0,
            amountTakenBack: 0,
        });
    }

    handleSpawnPoints(
        timestamp: number,
        world: World,
        portals: Map<Address, Portal>,
        protocol: Protocol,
        resources: Map<Address, Resource>,
        nodes: Map<Address, ResourceNode>,
        bubbles: Map<Address, Bubble>,
    ){
        const pointsCount = resources.size;
        const maxPointsOnMap = this.maxPoints;
        const pointsToSpawn = Math.min(
            maxPointsOnMap - pointsCount,
            this.spawnAmount,
        );

        if(pointsToSpawn <= 0) return;
        
        const amountSpawned = generateResources(
            world,
            resources,
            nodes,
            portals,
            bubbles,
            pointsToSpawn,
        );

        console.log("Spawned", amountSpawned, "points");

    }

    //Find bubbles around that world that are no longer moving that are less than PLANCK_MASS * 10 and remove them and deposit their mass into the protocol
    handleStrayBubbles(
        timestamp: number,
        world: World,
        portals: Map<Address, Portal>,
        protocol: Protocol,
        resources: Map<Address, Resource>,
        nodes: Map<Address, ResourceNode>,
        bubbles: Map<Address, Bubble>,
    ){
        bubbles.forEach((bubble, address) => {
            const mass = getBubbleEthMass(bubble);
            const speed = bubble.body.getLinearVelocity().length();
            const minMass = PLANCK_MASS * 10;
            const minSpeed = 0.01;

            if(mass < minMass && speed < minSpeed){
                //Deposit mass into protocol
                protocol.deposit(AssetType.ETH, mass);

                //Remove bubble
                destroyBubble(bubbles, bubble);
            }
        });

        
    }
    
    run(
        timestamp: number,
        world: World,
        users: Map<Address, User>,
        bubbles: Map<Address, Bubble>,
        portals: Map<Address, Portal>,
        obstacles: ObstacleGroup[],
        nodes: Map<Address, ResourceNode>,
        resources: Map<Address, Resource>,
        protocol: Protocol,
        pendingInputs: Array<InputWithExecutionTime>,
    ){
        const timePassed = timestamp - this.last;
        if(timePassed < this.cycle) return;

        this.handleSpawnPoints(timestamp, world, portals, protocol, resources, nodes, bubbles);
        this.handleStrayBubbles(timestamp, world, portals, protocol, resources, nodes, bubbles);
        this.last = timestamp;
    }

    init(state: ProtocolState) {
        this.clear();
        this.last = state.last;
        this.balance.set(AssetType.ETH, state.balance);
    }

    clear() {
        this.last = 0;
        this.balance = new Map<AssetType, number>();
    }
}