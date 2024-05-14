import { Entity } from "./entity";

export interface PuncturePoint {
    x: number; //relative to bubble center
    y: number; //relative to bubble center
}

export interface Puncture {
    start: number; // timestamp of puncture start
    amount: number; // amount of resource to be emitted
}

export interface Bubble extends Entity {
    controllable: boolean;
    punctures?: Map<PuncturePoint, Puncture>;
    lastPunctureEmit?: number;
}
