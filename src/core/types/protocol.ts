import { World } from "planck-js";
import { generateResources } from "../funcs/resource";
import { nodes } from "../world";
import { Address } from "./address";
import { Bubble } from "./bubble";
import { InputWithExecutionTime } from "./inputs";
import { Obstacle, ObstacleGroup } from "./obstacle";
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
    SPAWN = 10,
    TRADE = 2.5,
    BORDER = 10,  
}

export class Protocol {
    //Constants
    MAX_NODES = 10;
    MAX_RESOURCES = 10000;
    inflationRate = 1 // Max inflation rate per cycle
    cycle: number = 10; // Should run every 100s

    //State
    last: number = 0; // Last time the protocol was run
    balance: Map<AssetType, number> = new Map<AssetType, number>(); // Balance of the protocol
    pendingBalance: Map<AssetType, number> = new Map<AssetType, number>(); // Pending balance of ETH or ENERGY to be used for buyback if ETH or respawn if ENERGY
    pendingSpawn: Map<AssetType, number> = new Map<AssetType, number>(); // Pending spawn of ETH or ENERGY to be used for buyback if ETH or respawn if ENERGY

    deposit(type: AssetType, amount: number) { 
       //console.log("Depositing", type, amount);
        if(type == AssetType.ENERGY) this.addPendingBalance(type, amount);
        else {
            let amountForBuyBack = amount * BUYBACK_PERCENTAGE;
            let remaining = amount - amountForBuyBack;
            this.addBalance(type, remaining);
            this.addPendingBalance(AssetType.ETH, amountForBuyBack);
        }
    }
    withdraw(type: AssetType, amount: number) { 
       //console.log("Withdrawing", type, amount);
        this.addBalance(type, -amount);
    }
    processFee(type: FeeType, asset: AssetType, amount: number) {
        const feeTypeAsString = FeeType[type];
       //console.log("Processing fee", feeTypeAsString, "for", amount, asset);
        const fee = amount * type / 100;
        this.deposit(asset, fee);
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
    getPendingBalance(type: AssetType) {
        return this.pendingBalance.get(type);
    }

    addPendingBalance(type: AssetType, amount: number) {
        //handle if new type doesn't exist
        const balance = this.pendingBalance.get(type);
        if(balance) this.pendingBalance.set(type, balance + amount);
        else this.pendingBalance.set(type, amount);

       //console.log("Adding pending balance", type, amount, "pending balance", this.pendingBalance);
    }
 
    removePendingBalance(type: AssetType, amount: number) {
        //handle if new type doesn't exist
        const balance = this.pendingBalance.get(type);
        if(balance >= amount) this.pendingBalance.set(type, balance - amount);
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
            amountBought += node.token.buyWithoutFee(buyPerNode);
        });
       //console.log("Bought back", amountBought, "energy for", ethAmount, "ETH");
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
        const pendingBalance = this.getPendingBalance(type);
        if(pendingBalance) {
           //console.log("Pending balance found, handling", type, pendingBalance)
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

       //console.log("Handled pending balance", type, pendingBalance);
    }

    getPendingSpawn(type: AssetType) {
        return this.pendingSpawn.get(type);
    }

    addPendingSpawn(type: AssetType, amount: number) {
       //console.log("Adding pending spawn", type, amount);
        //handle if new type doesn't exist
        const balance = this.pendingSpawn.get(type);
        if(balance) this.pendingSpawn.set(type, balance + amount);
        else this.pendingSpawn.set(type, amount);
       //console.log("Pending spawn", this.pendingSpawn);
    }

    removePendingSpawn(type: AssetType, amount: number) {
       //console.log("Removing pending spawn", type, amount);
        //handle if new type doesn't exist
        const balance = this.pendingSpawn.get(type);
        if(balance >= amount) this.pendingSpawn.set(type, balance - amount);
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
        const pending = this.getPendingSpawn(type);
        const amountToSpawn = Math.min(pending, this.getPendingSpawn(type), this.inflationRate);

        generateResources(
            world,
            resources,
            nodes,
            portals,
            bubbles,
            amountToSpawn,
        );

        this.removePendingSpawn(type, amountToSpawn);

       //console.log("Spawned", amountToSpawn, type);
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