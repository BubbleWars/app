import { PLANCK_MASS } from "../consts";
import { clamp } from "../funcs/resource";
import { preciseRound } from "../funcs/utils";
import { Entity } from "./entity";

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
    inflation: number;
    burn: number;
    k: number;

    inflationRate: number; // Amount of inflation per period
    inflationPeriod: number; // Seconds, time between inflations
    lastInflation: number; // Last time inflation was applied

    constructor(currentSupply = 0, marketCap = 0, inflation = 0, burn = 0, k = 0.001) {
        this.currentSupply = currentSupply;
        this.marketCap = marketCap;
        this.inflation = inflation;
        this.burn = burn;
        this.k = k;
        this.lastInflation = 0;
        this.inflationRate = 1;
        //Every 1hr
        this.inflationPeriod = 60;
    }

    getSupplyRatio() {
        if (this.currentSupply + this.inflation - this.burn <= 0) {
            return 1;
        }
        return this.currentSupply / (this.currentSupply + this.inflation - this.burn);
    }

    // Calculate the area under the curve from `x1` to `x2`
    getChangeInValue(x1, x2) {
        return this.k * ((x2 ** 3 / 3) - (x1 ** 3 / 3));
    }

    // Get the true change in value with the modifier applied
    getTrueChangeInValue(changeInSupply) {
        const currentSupply = this.currentSupply;
        const realChangeInSupply = changeInSupply * this.getSupplyRatio();
        const changeInValue = this.getChangeInValue(currentSupply, currentSupply + realChangeInSupply);
        return changeInValue;
    }

    // Function to calculate the change in supply given a change in value
    getChangeInSupply(delta) {
        const currentSupplyCubed = this.currentSupply ** 3;
        const newSupplyCubed = 3 * delta / this.k + currentSupplyCubed;
        const newSupply = Math.cbrt(newSupplyCubed);

        const supplyChange = newSupply - this.currentSupply;
        return supplyChange;
    }

    // Function to calculate the true change in supply given a change in value, taking into account the modifier
    getTrueChangeInSupply(delta) {
        const changeInSupply = this.getChangeInSupply(delta);
        const ratio = this.getSupplyRatio();

        return changeInSupply * ratio;

    }

    // Function to inflate the supply
    inflateSupply(amount) {
        this.inflation += amount;
        this.inflation = preciseRound(this.inflation, 9);
        console.log("inflating supply", amount, this.currentSupply);
    }

    // Function to burn the supply
    burnSupply(amount) {
        this.burn += amount;
        this.burn = preciseRound(this.burn, 9);
        console.log("burning supply", amount, this.currentSupply);
    }

    // Function to sell tokens and return the change in value
    sell(amount) {
        const clippedAmount = clamp(amount, 0, this.currentSupply);
        if (amount > this.currentSupply) {
            console.log("amount", amount, "current supply", this.currentSupply);
            //throw new Error('Cannot sell more than the current supply')
        }

        const oldSupply = this.currentSupply;
        const newSupply = this.currentSupply - clippedAmount;

        const changeInValue = this.getTrueChangeInValue(-clippedAmount);

        // Update the current supply
        this.currentSupply = preciseRound(newSupply, 9);
        // Decrease the market cap proportionally
        this.marketCap += changeInValue;

        console.log("selling", amount, changeInValue, this.currentSupply);

        return Math.abs(changeInValue);
    }

    // Function to buy tokens and return the amount of tokens received
    buy(value) {
        const supplyChange = this.getTrueChangeInSupply(value);

        // Update the current supply
        this.currentSupply += supplyChange;
        this.currentSupply = preciseRound(this.currentSupply, 9);
        // Increase the market cap proportionally
        this.marketCap += value;

        console.log("buying", value, supplyChange, this.currentSupply);

        return supplyChange;
    }
}
