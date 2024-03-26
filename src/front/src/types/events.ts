import { Event } from "../../../event/src/index";

/**
 * Global Events class
 */
export class cEvent extends Event<Events, EventsTypes> {}

/**
 * Global Events Types Enum
 */
export enum Events {
    ClientTimeout,
    ClientKill,
}

/**
 * Global Events Types
 */
export type EventsTypes = ClientTimeout | ClientKill;

/**
 * Events Types
 * See description to know when they should be thrown.
 */
// Client Timeout
export type ClientTimeout = {
    timoutTimes: number;
};

export type ClientKill = {
    playerKilledId: String;
};
