export enum EventsType {
    CreateWorld,
    CreateBubble,
    CreatePortal,
    EmitBubble,
    Absorb,
}

export interface Event {
    type: EventsType,
}

export interface CreateWorld extends Event {

}

export interface CreateBubble extends Event {
    

}

export interface CreatePortal extends Event {

}

export interface EmitBubble extends Event {

}

export interface Absorb extends Event {

}

