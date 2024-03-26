/**
 * Global Events Types Enum
 */
export enum Events {
    GameStart,
    GameEnd,
    PlayerConnection,
    PlayerDeath,
}

/**
 * Global Events Types
 */
export type EventsTypes = GameStart | GameEnd | PlayerConnection | PlayerDeath;

/**
 * Events Types
 * See description to know when they should be thrown.
 */
// Game starts
export type GameStart = {
    ether: number;
    timestamp: number;
    playerId: String;
};

// Game ends
export type GameEnd = {
    ether: number;
    timestamp: number;
    playerId: String;
};

// Player connects
export type PlayerConnection = {
    ether: number;
    timestamp: number;
    playerId: String;
};

// Player dies
export type PlayerDeath = {
    timestamp: number;
    playerId: String;
    byPlayerId: String;
};
