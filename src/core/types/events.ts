export enum EventsType {
  CreateWorld,
  CreateBubble,
  DestroyBubble,
  CreateResource,
  DestroyResource,
  CreatePortal,
  EmitBubble,
  Absorb,
}

export interface BaseEvent {
  timestamp: number;
  type: EventsType;
}

export interface CreateWorld extends BaseEvent {}

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

export interface CreatePortal extends BaseEvent {}

export interface EmitBubble extends BaseEvent {}

export interface Absorb extends BaseEvent {}

export type Event =
  | CreateWorld
  | CreateBubble
  | DestroyBubble
  | CreatePortal
  | EmitBubble
  | Absorb
  | CreateResource
  | DestroyResource;
