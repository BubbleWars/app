export enum EventsType {
    CreateWorld,
    CreateBubble,
    DestroyBubble,
    CreateResource,
    DestroyResource,
    CreatePortal,
    EmitBubble,
    EmitResource,
    AbsorbBubble,
    AbsorbResource,
    BuyResource,
    SellResource,
    PunctureBubble,
    PunctureEmit,
    SpawnPortal,
}

export interface BaseEvent {    
    blockNumber: number;
    timestamp: number;
    type: EventsType;
}

export interface InputBaseEvent extends BaseEvent {
    hash: string; // hash of the transaction
    sender: string; // address of the sender
}

export interface CreateWorld extends BaseEvent {
    type: EventsType.CreateWorld;
}

export interface CreateBubble extends BaseEvent {
    type: EventsType.CreateBubble;
    id: string;
    position: { x: number; y: number }; // position of the bubble at the time of creation
}

export interface DestroyBubble extends BaseEvent {
    type: EventsType.DestroyBubble;
    id: string;
    position: { x: number; y: number }; // position of the bubble at the time of destruction
}

export interface CreateResource extends BaseEvent {
    type: EventsType.CreateResource;
    id: string;
    position: { x: number; y: number }; // position of the resource at the time of creation
}

export interface DestroyResource extends BaseEvent {
    type: EventsType.DestroyResource;
    id: string;
    position: { x: number; y: number }; // position of the resource at the time of destruction
}

export interface CreatePortal extends BaseEvent {
    type: EventsType.CreatePortal;
}


//Real time events
export interface AbsorbBubble extends BaseEvent {
    type: EventsType.AbsorbBubble;
    absorber: string; // address of user that absorbed the bubble
    absorbed: string; // address of user that was absorbed
    absorberEntityId: string; // id of the bubble that absorbed
    absorbedResourceAmount: number;
    amount: number;
    isPortal: boolean;
}

export interface AbsorbResource extends BaseEvent {
    type: EventsType.AbsorbResource;
    absorber: string; // address of user that absorbed the resource
    absorberEntityId: string; // id of the bubble that absorbed
    amount: number;
    isPortal: boolean;
}

export interface BuyResource extends BaseEvent {
    type: EventsType.BuyResource;
    buyer: string;
    amount: number;
    cost: number;
}

export interface SellResource extends BaseEvent {
    type: EventsType.SellResource;
    seller: string;
    amount: number;
    cost: number;
}

export interface PunctureBubble extends BaseEvent {
    type: EventsType.PunctureBubble;
    puncturerAddress: string;
    puncturedAddress: string;
    amount: number; //Amount of ETH that will be emitted from puncture
}

export interface PunctureEmit extends BaseEvent {
    type: EventsType.PunctureEmit;
    puncturerAddress: string;
    puncturedAddress: string;
    amount: number; //Amount of ETH that will be emitted from puncture
}



//Input Events
export interface SpawnPortal extends InputBaseEvent {
    type: EventsType.SpawnPortal;
    portalId: string;
    userAddress: string;
    amount: number;
}

export interface EmitResource extends InputBaseEvent {
    type: EventsType.EmitResource;
    userAddress: string;
    amount: number;
    fromPortal: boolean,
}

export interface EmitBubble extends InputBaseEvent {
    type: EventsType.EmitBubble;
    userAddress: string;
    amount: number;
    fromPortal: boolean,
}




export type Event =
    | CreateWorld
    | CreateBubble
    | DestroyBubble
    | CreatePortal
    | EmitBubble
    | EmitResource
    | AbsorbBubble
    | CreateResource
    | DestroyResource
    | AbsorbResource
    | BuyResource
    | SellResource
    | PunctureBubble
    | PunctureEmit
    | SpawnPortal;

