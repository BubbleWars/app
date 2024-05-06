import { Entity } from "./entity";

export const RESOURCE_INFLATION_RATE = 1 / (60 * 60 * 24); // 1 per day

export enum ResourceType {
    RED, // Attack resource for puncturing bubbles
    BLUE, // Defense resource
    GREEN, // Stun weapon
    VIOLET, // Gravity resource for portals
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
    pendingEthMass: number; // amount of ETH mass pending to be added to the node
    pendingResourceMass: number; // amount of resource added back to the node
    emissionDirection: { x: number; y: number };
    lastEmission: number;
}
