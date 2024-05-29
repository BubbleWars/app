import { World } from "planck-js";
import { generateResources } from "../funcs/resource";
import { nodes } from "../world";
import { Address } from "./address";
import { Bubble } from "./bubble";
import { InputWithExecutionTime } from "./inputs";
import { Obstacle } from "./obstacle";
import { Portal } from "./portal";
import { Resource, ResourceNode } from "./resource";
import { User } from "./user";
import { ProtocolState } from "./state";

//Protocol revenue split
const BUYBACK_PERCENTAGE = 0.5;
const FARMER_PERCENTAGE = 0.5;

export enum AssetType {
    ETH = "ETH",
    ENERGY = "ENERGY",
}

export enum FeeType {
    SPAWN = 5,
    TRADE = 5,
    BORDER = 10,  
}

export class Protocol {
    //Constants
    MAX_NODES = 10;
    MAX_RESOURCES = 10000;
    inflationRate = 10 // Max inflation rate per cycle
    cycle: number = 100; // Should run every 100s

    //State
    last: number = 0; // Last time the protocol was run
    balance: Map<AssetType, number> = new Map<AssetType, number>(); // Balance of the protocol
    pendingBalance: Map<AssetType, number> = new Map<AssetType, number>(); // Pending balance of ETH or ENERGY to be used for buyback if ETH or respawn if ENERGY
    pendingSpawn: Map<AssetType, number> = new Map<AssetType, number>(); // Pending spawn of ETH or ENERGY to be used for buyback if ETH or respawn if ENERGY

    deposit(type: AssetType, amount: number) { 
        if(type == AssetType.ENERGY) this.addPendingBalance(type, amount);
        else {
            let amountForBuyBack = amount * BUYBACK_PERCENTAGE;
            let remaining = amount - amountForBuyBack;
            this.balance[type] += remaining;
        }
    }
    withdraw(type: AssetType, amount: number) { 
        this.balance[type] -= amount 
    }
    processFee(type: FeeType, asset: AssetType, amount: number) {
        const fee = amount * type / 100;
        this.deposit(asset, fee);
        return amount - fee;
    }

    getBalance(type: AssetType) {
        return this.balance[type];
    }
    addBalance(type: AssetType, amount: number) {
        const balance = this.balance[type];
        if(balance) this.balance[type] = balance + amount;
        else this.balance[type] = amount;
    }
    getPendingBalance(type: AssetType) {
        return this.pendingBalance[type];
    }

    addPendingBalance(type: AssetType, amount: number) {
        //handle if new type doesn't exist
        const balance = this.pendingBalance[type];
        if(balance) this.pendingBalance[type] = balance + amount;
        else this.pendingBalance[type] = amount;
    }
 
    removePendingBalance(type: AssetType, amount: number) {
        //handle if new type doesn't exist
        const balance = this.pendingBalance[type];
        if(balance >= amount) this.pendingBalance[type] -= amount;
        else false;
    }

    buyBack(
        protocol: Protocol,
        ethAmount: number,
        nodes: Map<Address, ResourceNode>,
    ) {
        const buyPerNode = ethAmount / nodes.size;
        let amountBought = 0;
        nodes.forEach((node) => {
            amountBought += node.token.buy(protocol, buyPerNode);
        });
        return amountBought;
    }

    handlePendingBalance(
        type: AssetType, 
        world: World,
        users: Map<Address, User>,
        bubbles: Map<Address, Bubble>,
        portals: Map<Address, Portal>,
        obstacles: Map<Address, Obstacle>,
        nodes: Map<Address, ResourceNode>,
        resources: Map<Address, Resource>,
        protocol: Protocol,
        pendingInputs: Array<InputWithExecutionTime>,
    ) {
        const pendingBalance = this.pendingBalance[type];
        if(pendingBalance) {
            switch (type) {
                case AssetType.ENERGY:
                    this.addPendingSpawn(type, pendingBalance);
                    this.removePendingBalance(type, pendingBalance);
                    break;
            
                case AssetType.ETH:
                    const energyToSpawn = this.buyBack(protocol, pendingBalance, nodes);
                    this.addPendingSpawn(AssetType.ENERGY, energyToSpawn);
                    this.removePendingBalance(type, pendingBalance);
                    break;
                default:
                    break;
            }
        }
    }

    getPendingSpawn(type: AssetType) {
        return this.pendingSpawn[type];
    }

    addPendingSpawn(type: AssetType, amount: number) {
        //handle if new type doesn't exist
        const balance = this.pendingSpawn[type];
        if(balance) this.pendingSpawn[type] = balance + amount;
        else this.pendingSpawn[type] = amount; 
    }

    removePendingSpawn(type: AssetType, amount: number) {
        //handle if new type doesn't exist
        const balance = this.pendingSpawn[type];
        if(balance >= amount) this.pendingSpawn[type] -= amount;
        else false;
    }

    handlePendingSpawn(
        type: AssetType,
        world: World,
        users: Map<Address, User>,
        bubbles: Map<Address, Bubble>,
        portals: Map<Address, Portal>,
        obstacles: Map<Address, Obstacle>,
        nodes: Map<Address, ResourceNode>,
        resources: Map<Address, Resource>,
        pendingInputs: Array<InputWithExecutionTime>,
    ) {
        const pending = this.pendingSpawn[type];
        const amountToSpawn = Math.min(pending, this.balance[type], this.inflationRate);

        generateResources(
            world,
            resources,
            nodes,
            portals,
            bubbles,
            amountToSpawn,
        );

        this.removePendingSpawn(type, amountToSpawn);
    }
    
    run(
        timestamp: number,
        world: World,
        users: Map<Address, User>,
        bubbles: Map<Address, Bubble>,
        portals: Map<Address, Portal>,
        obstacles: Map<Address, Obstacle>,
        nodes: Map<Address, ResourceNode>,
        resources: Map<Address, Resource>,
        protocol: Protocol,
        pendingInputs: Array<InputWithExecutionTime>,
    ){
        const timePassed = timestamp - this.last;
        if(timePassed < this.cycle) {
            this.last = timestamp;
            return;
        }

        this.handlePendingBalance(
            AssetType.ETH,
            world, 
            users, 
            bubbles, 
            portals, 
            obstacles, 
            nodes, 
            resources,
            protocol,
            pendingInputs
        );
        this.handlePendingBalance(
            AssetType.ENERGY,
            world, 
            users, 
            bubbles, 
            portals, 
            obstacles, 
            nodes, 
            resources, 
            protocol,
            pendingInputs
        );
        this.handlePendingSpawn(
            AssetType.ENERGY, 
            world, 
            users, 
            bubbles, 
            portals, 
            obstacles, 
            nodes, 
            resources, 
            pendingInputs
        );

        this.last = timestamp;
    }

    init(state: ProtocolState) {
        this.clear();
        this.last = state.last;
        this.balance.set(AssetType.ETH, state.balance);
        this.balance.set(AssetType.ENERGY, state.pendingEnergyBalance);
        this.pendingBalance.set(AssetType.ETH, state.pendingEthBalance);
        this.pendingBalance.set(AssetType.ENERGY, state.pendingEnergyBalance);
        this.pendingSpawn.set(AssetType.ENERGY, state.pendingEnergySpawn);
        this.pendingSpawn.set(AssetType.ETH, state.pendingEthBalance);
    }

    clear() {
        this.last = 0;
        this.balance = new Map<AssetType, number>();
        this.pendingBalance = new Map<AssetType, number>();
        this.pendingSpawn = new Map<AssetType, number>();
    }
}