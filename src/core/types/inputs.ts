import { ResourceType } from "./resource";

export enum InputType {
    SpawnPortal = "spawnPortal",
    Emit = "emit",
    Deposit = "deposit",
    Withdraw = "withdraw",
    Invalid = "invalid",
    Puncture = "puncture", //puncture bubble
    PayRent = "payRent",
    ProtocolWithdraw = "protocolWithdraw",
    ProtocolSend = "protocolSend",
    ProtocolDeposit = "protocolDeposit",
}

export interface BaseInput {
    type: InputType;
    timestamp?: number;
    sender?: string;
    blockNumber?: number;
    inputIndex?: number;
    epochIndex?: number;
}

export interface Invalid {
    type: InputType.Invalid;
}

export interface Deposit extends BaseInput {
    type: InputType.Deposit;
    amount: number;
}

export interface Withdraw extends BaseInput {
    type: InputType.Withdraw;
    amount: number;
}

export interface PayRent extends BaseInput {
    type: InputType.PayRent;
}

export interface ProtocolWithdraw extends BaseInput {
    type: InputType.ProtocolWithdraw;
}

export interface ProtocolSend extends BaseInput {
    type: InputType.ProtocolSend;
    amount: number;
    recipient: string;
}

export interface ProtocolDeposit extends BaseInput {
    type: InputType.ProtocolDeposit;
    amount: number;
}

export interface SpawnPortal extends BaseInput {
    type: InputType.SpawnPortal;
    mass: number;
}

export interface Emit extends BaseInput {
    type: InputType.Emit;
    executionTime?: number;
    from: string; //bubble or portal id
    mass: number; //mass of bubble to emit
    emissionType?: ResourceType | `bubble`;
    direction: { x: number; y: number }; //direction to emit bubble
}

export interface PunctureInput extends BaseInput {
    type: InputType.Puncture;
    bubbleId: string;
    resourceId: string;
    puncturePoint: { x: number; y: number };
    amount: number;
    executionTime?: number;
}

export type Input = SpawnPortal | Emit | Deposit | Withdraw | Invalid | PunctureInput | PayRent | ProtocolWithdraw | ProtocolSend | ProtocolDeposit;
export type InputWithExecutionTime = Emit | PunctureInput | PayRent;

export interface AdvanceData {
    metadata: {
        msg_sender: string;
        epoch_index: number;
        input_index: number;
        block_number: number;
        timestamp: number;
    };
    payload: string;
}

export interface InspectData {
    payload: string;
}

export enum InspectType {
    State = "state", //fetch state at time in value
}

export interface Inspect {
    type: InspectType;
    value: number;
}

// {
//     "metadata":{
//     "msg_sender":"0xf5de34d6bbc0446e2a45719e718efebaae179dae",
//     "epoch_index":0,
//     "input_index":0,
//     "block_number":36,
//     "timestamp":1703205427
//     },
//     "payload":"0x70ac08179605af2d9e75782b8decdd3c22aa4d0c"
// }
