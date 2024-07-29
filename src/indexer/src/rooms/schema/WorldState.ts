import { Schema, ArraySchema, type, MapSchema } from "@colyseus/schema";
import { BaseEvent, Event, EventsType } from "../../../../core/types/events";

export class Vector2Schema extends Schema {
    @type("number") x: number = 0;
    @type("number") y: number = 0;
}

export class UserSchema extends Schema {
    @type("string") address: string = "";
    @type("number") balance: number = 0;
    @type("number") points: number = 0;
}

export class UserSocialSchema extends Schema {
    @type("string") address: string = "";
    @type("string") pfpUrl: string = "";
    @type("string") social: string = "";
    @type("string") privyId: string = "";
}

export class InputWithExecutionTimeSchema extends Schema {
    @type("string") type: string = "";
    @type("number") executionTime: number = 0;
    @type("string") from: string = "";
    @type("number") mass: number = 0;
    @type("string") emissionType: string = "";
    @type("number") directionX: number = 0;
    @type("number") directionY: number = 0;
}

export class EntityResourceStateSchema extends Schema {
    @type("number") resource: number = 0;
    @type("number") mass: number = 0;
}

export class BubblePunctureSchema extends Schema {
    @type("string") point: string = "";
    @type("string") puncture: string = "";
}

export class BubbleStateSchema extends Schema {
    @type("string") id: string = "";
    @type("string") owner: string = "";

    @type("number") positionX: number = 0;
    @type("number") positionY: number = 0;
    @type("number") velocityX: number = 0;
    @type("number") velocityY: number = 0;
    @type("number") mass: number = 0;
    @type([EntityResourceStateSchema]) resources =
        new ArraySchema<EntityResourceStateSchema>();
    @type([BubblePunctureSchema]) punctures =
        new ArraySchema<BubblePunctureSchema>();
    @type("number") lastPunctureEmit: number = 0;
    @type("number") startPositionX: number = 0;
    @type("number") startPositionY: number = 0;
    @type("string") from: string = "";
}

export class PortalStateSchema extends Schema {
    @type("string") id: string = "";
    @type("string") owner: string = "";
    @type("number") positionX: number = 0;
    @type("number") positionY: number = 0;
    @type("number") mass: number = 0;
    @type([EntityResourceStateSchema]) resources =
        new ArraySchema<EntityResourceStateSchema>();
}

export class ObstacleStateSchema extends Schema {
    @type("string") id: string = "";
    @type("number") positionX: number = 0;
    @type("number") positionY: number = 0;
    @type("number") angle: number = 0;
    @type("string") type: string = "";
    @type("number") radius: number = 0;
    @type([Vector2Schema]) vertices = new ArraySchema<Vector2Schema>();
}

export class ResourceNodeStateSchema extends Schema {
    @type("string") id: string = "";
    @type("number") type: number = 0;
    @type("number") positionX: number = 0;
    @type("number") positionY: number = 0;
    @type("number") mass: number = 0;
    @type("number") emissionDirectionX: number = 0;
    @type("number") emissionDirectionY: number = 0;
    @type("number") lastEmission: number = 0;

    //TokenInfo
    @type("number") currentSupply: number = 0;
    @type("number") marketCap: number = 0;
    @type("number") k: number = 0;
}

export class ResourceStateSchema extends Schema {
    @type("string") id: string = "";
    @type("string") owner: string = "";

    @type("number") type: number = 0;
    @type("number") positionX: number = 0;
    @type("number") positionY: number = 0;
    @type("number") velocityX: number = 0;
    @type("number") velocityY: number = 0;
    @type("number") mass: number = 0;
}

export class ProtocolStateSchema extends Schema {
    @type("number") balance: number = 0;
    @type("number") pendingEthBalance: number = 0;
    @type("number") pendingEnergyBalance: number = 0;
    @type("number") pendingEnergySpawn: number = 0;
    @type("number") rentCost: number= 0;
    @type("number") rentDueAt: number = 0;
    @type(["string"]) hasPayedRent: ArraySchema<string> = new ArraySchema<string>();
}

export class WorldState extends Schema {
    @type("number") timestamp: number = 0;
    @type([InputWithExecutionTimeSchema]) pendingInputs =
        new ArraySchema<InputWithExecutionTimeSchema>();
    @type([UserSchema]) users = new ArraySchema<UserSchema>();
    @type([UserSocialSchema]) userSocials = new ArraySchema<UserSocialSchema>();
    @type([BubbleStateSchema]) bubbles = new ArraySchema<BubbleStateSchema>();
    @type([PortalStateSchema]) portals = new ArraySchema<PortalStateSchema>();
    @type([ObstacleStateSchema]) obstacles =
        new ArraySchema<ObstacleStateSchema>();
    @type([ResourceNodeStateSchema]) nodes =
        new ArraySchema<ResourceNodeStateSchema>();
    @type([ResourceStateSchema]) resources =
        new ArraySchema<ResourceStateSchema>();
    @type({ map: Vector2Schema }) syncBubbleStartPositions =
        new MapSchema<Vector2Schema>();
    @type({ map: Vector2Schema }) syncBubbleEndPositions =
        new MapSchema<Vector2Schema>();
    @type({ map: Vector2Schema }) syncResourceStartPositions =
        new MapSchema<Vector2Schema>();
    @type(ProtocolStateSchema) protocol = new ProtocolStateSchema();
    
}


export class EventSchema extends Schema {
    @type("number") blockNumber: number = 0;
    @type("number") timestamp: number = 0;
    @type("number") type: number = 0;
    @type("string") hash: string = "";
    @type("string") sender: string = "";
}

export class CreateWorld extends EventSchema {
}

export class CreateBubble extends EventSchema {
    @type("string") id: string = "";
    @type("number") positionX: number = 0;
    @type("number") positionY: number = 0;
}

export class DestroyBubble extends EventSchema {
    @type("string") id: string = "";
    @type("number") positionX: number = 0;
    @type("number") positionY: number = 0;
}

export class CreateResource extends EventSchema {
    @type("string") id: string = "";
    @type("number") positionX: number = 0;
    @type("number") positionY: number = 0;
}

export class DestroyResource extends EventSchema {
    @type("string") id: string = "";
    @type("number") positionX: number = 0;
    @type("number") positionY: number = 0;
}

export class CreatePortal extends EventSchema {
}

export class AbsorbBubble extends EventSchema {
    @type("string") absorber: string = "";
    @type("string") absorbed: string = "";
    @type("string") absorberEntityId: string = "";
    @type("number") absorbedResourceAmount: number = 0;
    @type("number") amount: number = 0;
    @type("boolean") isPortal: boolean = false;
}

export class AbsorbResource extends EventSchema {
    @type("string") absorber: string = "";
    @type("string") absorberEntityId: string = "";
    @type("number") amount: number = 0;
    @type("boolean") isPortal: boolean = false;
}

export class BuyResource extends EventSchema {
    @type("string") buyer: string = "";
    @type("number") amount: number = 0;
    @type("number") cost: number = 0;
}

export class SellResource extends EventSchema {
    @type("string") seller: string = "";
    @type("number") amount: number = 0;
    @type("number") cost: number = 0;
}

export class PunctureBubble extends EventSchema {
    @type("string") puncturerAddress: string = "";
    @type("string") puncturedAddress: string = "";
    @type("number") amount: number = 0;
}

export class PunctureEmit extends EventSchema {
    @type("string") puncturerAddress: string = "";
    @type("string") puncturedAddress: string = "";
    @type("number") amount: number = 0;
}

export class SpawnPortal extends EventSchema {
    @type("string") portalId: string = "";
    @type("string") userAddress: string = "";
    @type("number") amount: number = 0;
}

export class EmitResource extends EventSchema {
    @type("string") userAddress: string = "";
    @type("number") amount: number = 0;
    @type("boolean") fromPortal: boolean = false;
}

export class EmitBubble extends EventSchema {
    @type("string") userAddress: string = "";
    @type("number") amount: number = 0;
    @type("boolean") fromPortal: boolean = false;
}


// Function to convert EventSchema to corresponding Event type
export function schemaToEvent(schema: EventSchema): Event {
    return schema as Event;
}

// Function to convert Event type to corresponding EventSchema
export function eventToSchema(event: Event): EventSchema {
    const schema = new EventSchema();
    Object.assign(schema, event);
    return schema;
}