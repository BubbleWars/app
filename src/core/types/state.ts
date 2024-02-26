import { Puncture, PuncturePoint } from "./bubble";
import { Event } from "./events";
import { InputWithExecutionTime } from "./inputs";
import { ResourceType } from "./resource";
import { User } from "./user";

export interface BubbleState {
    id: string,
    owner: string,
    position: { x: number, y: number },
    velocity: { x: number, y: number },
    mass: number,
    resources: { resource: ResourceType, mass: number }[],
    punctures: { point: PuncturePoint,  puncture: Puncture }[],
    lastPunctureEmit: number | undefined
}

export interface PortalState {
    id: string,
    owner: string,
    position: { x: number, y: number },
    mass: number,
    resources: { resource: ResourceType, mass: number }[],
}

export interface ObstacleState {
    id: string,
    position: { x: number, y: number },
    velocity: { x: number, y: number },
    vertices: { x: number, y: number }[],
}

export interface ResourceNodeState {
    id: string,
    type: ResourceType,
    position: { x: number, y: number },
    mass: number,
    emissionDirection: { x: number, y: number },
    lastEmission: number,
}

export interface ResourceState {
    id: string,
    owner: string,
    type: ResourceType,
    position: { x: number, y: number },
    velocity: { x: number, y: number },
    mass: number,
}

export interface Snapshot {
    timestamp: number,
    pendingInputs: InputWithExecutionTime[],
    users: User[],
    bubbles: BubbleState[],
    portals: PortalState[],
    obstacles: ObstacleState[],
    nodes: ResourceNodeState[],
    resources: ResourceState[],
}

export type History = Snapshot[]

