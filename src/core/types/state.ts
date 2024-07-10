import { ShapeType } from "planck-js/lib/shape";
import { Puncture, PuncturePoint } from "./bubble";
import { Attractor } from "./entity";
import { InputWithExecutionTime } from "./inputs";
import { ResourceType } from "./resource";
import { User } from "./user";
import { ObstacleGroupDef } from "./obstacle";
import { Address } from "./address";

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
    attractor: string | undefined;
}

export interface PortalState {
    id: string;
    owner: string;
    position: { x: number; y: number };
    mass: number;
    resources: { resource: ResourceType; mass: number }[];
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
    k: number; // k constant in bonding curve
}

export interface ResourceState {
    id: string;
    owner: string;
    type: ResourceType;
    position: { x: number; y: number };
    velocity: { x: number; y: number };
    mass: number;
    attractor: string | undefined;
}

export interface ShapeState {
    type: ShapeType;
}

export interface CircleState extends ShapeState {
    type: "circle",
    radius: number;
}

export interface PolygonState extends ShapeState {
    type: "polygon",
    vertices: { x: number; y: number }[];
}

export type ObstacleShapeState = ShapeState | CircleState | PolygonState;

export interface ObstacleState {
    id: string;
    shape: ObstacleShapeState;
    position: { x: number; y: number };
    angle: number;
    linearVelocity: { x: number; y: number };
    angularVelocity: number;
}

export interface ObstaclesState {
    obstaclesStates: ObstacleState[]; // For sending to clients
    obstacleSnapshots: ObstacleGroupDef[]; //For snapshots and rollbacks
}


export interface ProtocolState {
    last: number,
    balance: number //eth balance
    pendingEthBalance: number,
    pendingEnergyBalance: number,
    pendingEnergySpawn: number,
    rentCost: number,
    rentDueAt: number,
    hasPayedRent: Address[],
}


export interface Snapshot {
    timestamp: number;
    pendingInputs: InputWithExecutionTime[];
    users: User[];
    bubbles: BubbleState[];
    portals: PortalState[];
    nodes: ResourceNodeState[];
    resources: ResourceState[];
    attractors: Attractor[];
    obstacles: ObstaclesState;
    protocol: ProtocolState;
}

export type History = Snapshot[];
