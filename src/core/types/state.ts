import { Event } from "./events";
import { InputWithExecutionTime } from "./inputs";
import { User } from "./user";

export interface BubbleState {
    id: string,
    owner: string,
    position: { x: number, y: number },
    velocity: { x: number, y: number },
    mass: number,
}

export interface PortalState {
    id: string,
    owner: string,
    position: { x: number, y: number },
    mass: number,
}

export interface ObstacleState {
    id: string,
    position: { x: number, y: number },
    velocity: { x: number, y: number },
    vertices: { x: number, y: number }[],
}

export interface Snapshot {
    timestamp: number,
    pendingInputs: InputWithExecutionTime[],
    users: User[],
    bubbles: BubbleState[],
    portals: PortalState[],
    obstacles: ObstacleState[],
}

export type History = Snapshot[]

