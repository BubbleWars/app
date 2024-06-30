import { PLANCK_MASS } from "../consts";
import { clamp } from "../funcs/resource";
import { preciseRound } from "../funcs/utils";
import { Entity } from "./entity";
import { AssetType, FeeType, Protocol } from "./protocol";

export const RESOURCE_INFLATION_RATE = 1 / (60 * 60 * 24); // 1 per day

export enum ResourceType {
    ENERGY,
    BUBBLE,
}

export const RESOURCE_MASS = {
    [ResourceType.ENERGY]: PLANCK_MASS,
}

export interface Resource extends Entity {
    id: string;
    resource: ResourceType;
}

export interface ResourceNode extends Entity {
    id: string;
    resource: ResourceType;
    mass: number; // ETH mass injected into the node
    emitted: number; // amount of resource emitted
    pendingEthEmission: { depositor: string, amount: number }[]; // amount of ETH pending to be emitted
    pendingResourceEmission: { depositor: string, amount: number }[]; // amount of resource pending to be emitted
    emissionDirection: { x: number; y: number };
    lastEmission: number;
    token: Token;
}


//Inflating and burnable burnable bonding curve token
//y = x^3
export class Token {
    currentSupply: number;
    marketCap: number;
    k: number;


    constructor(currentSupply = 0, marketCap = 0, k = 0.00001) {
        this.currentSupply = currentSupply;
        this.marketCap = marketCap;
        this.k = k;
        //Every 1hr
    }

    // Calculate the area under the curve from `x1` to `x2`
    getChangeInValue(delta) {
        const currentSupply = this.currentSupply;
        const newSupply = currentSupply + delta;
        return this.k * ((newSupply ** 3 / 3) - (currentSupply ** 3 / 3));
    }

    // Function to calculate the change in supply given a change in value
    getChangeInSupply(delta) {
        const currentSupplyCubed = this.currentSupply ** 3;
        const newSupplyCubed = 3 * delta / this.k + currentSupplyCubed;
        const newSupply = Math.cbrt(newSupplyCubed);

        const supplyChange = newSupply - this.currentSupply;
        return supplyChange;
    }

    // Function to sell tokens and return the change in value
    sell(protocol: Protocol, amount: number) {
        const realAmount = preciseRound(amount, 9);
        const clippedAmount = clamp(realAmount, 0, this.currentSupply);
        if (amount > this.currentSupply) {
           //console.log("amount", realAmount, "current supply", this.currentSupply);
            //throw new Error('Cannot sell more than the current supply')
        }

        const oldSupply = this.currentSupply;
        const newSupply = this.currentSupply - clippedAmount;

        const changeInValue = preciseRound(this.getChangeInValue(-clippedAmount), 9);

        // Update the current supply
        this.currentSupply = preciseRound(newSupply, 9);
        // Decrease the market cap proportionally
        this.marketCap += preciseRound(changeInValue, 9);

       //console.log("selling", realAmount, changeInValue, this.currentSupply);

        const ethReceived = Math.abs(preciseRound(changeInValue, 3));
        const ethAfterFee = protocol.processFee(FeeType.TRADE, AssetType.ETH, ethReceived);

        return ethAfterFee;
    }

    buyWithoutFee(value: number) {
        const realValue = preciseRound(value, 9);
        const supplyChange = preciseRound(this.getChangeInSupply(realValue), 9 );

        // Update the current supply
        this.currentSupply += supplyChange;
4        // Increase the market cap proportionally
        this.marketCap += realValue;

       //console.log("buying", realValue, supplyChange, this.currentSupply);

        return supplyChange;
    }

    // Function to buy tokens and return the amount of tokens received
    buy(protocol: Protocol, value: number) {
        const realValue = preciseRound(value, 9);
        const valueAfterFee = protocol.processFee(FeeType.TRADE, AssetType.ETH, realValue);
        const supplyChange = preciseRound(this.getChangeInSupply(valueAfterFee), 9 );

        // Update the current supply
        this.currentSupply += supplyChange;
4        // Increase the market cap proportionally
        this.marketCap += realValue;

       //console.log("buying", realValue, supplyChange, this.currentSupply);
       //console.log("value after fee", valueAfterFee, "deducted", realValue - valueAfterFee);  

        return supplyChange;
    }
}
