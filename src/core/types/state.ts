import { Puncture, PuncturePoint } from "./bubble";
import { InputWithExecutionTime } from "./inputs";
import { ResourceType } from "./resource";
import { User } from "./user";

export interface BubbleState {
    id: string;
    owner: string;
    position: { x: number; y: number };
    velocity: { x: number; y: number };
    mass: number;
    resources: { resource: ResourceType; mass: number }[];
    punctures: { point: PuncturePoint; puncture: Puncture }[];
    lastPunctureEmit: number | undefined;
    from: string | undefined;
}

export interface PortalState {
    id: string;
    owner: string;
    position: { x: number; y: number };
    mass: number;
    resources: { resource: ResourceType; mass: number }[];
}

export interface ObstacleState {
    id: string;
    position: { x: number; y: number };
    velocity: { x: number; y: number };
    vertices: { x: number; y: number }[];
}

export interface ResourceNodeState {
    id: string;
    type: ResourceType;
    position: { x: number; y: number };
    mass: number;

    //Emission info
    emissionDirection: { x: number; y: number };
    lastEmission: number;
    pendingEthEmission: { depositor: string, amount: number }[]; // amount of ETH pending to be emitted
    pendingResourceEmission: { depositor: string, amount: number }[]; // amount of resource pending to be emitted


    //Token Bonding curve info
    currentSupply: number; // current supply of the token
    marketCap: number; // current amount of ETH in node
    inflation: number; // amount of token spawn without a buyer
    burn: number; // amount of token burned without sells
    k: number; // k constant in bonding curve

    inflationRate: number; // Amount of inflation per period
    inflationPeriod: number; // Seconds, time between inflations
    lastInflation: number; // Last time inflation was applied
}

export interface ResourceState {
    id: string;
    owner: string;
    type: ResourceType;
    position: { x: number; y: number };
    velocity: { x: number; y: number };
    mass: number;
}

export interface Snapshot {
    timestamp: number;
    pendingInputs: InputWithExecutionTime[];
    users: User[];
    bubbles: BubbleState[];
    portals: PortalState[];
    obstacles: ObstacleState[];
    nodes: ResourceNodeState[];
    resources: ResourceState[];
}

export type History = Snapshot[];
