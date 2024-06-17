import { Schema, ArraySchema, type, MapSchema } from "@colyseus/schema";

export class Vector2Schema extends Schema {
    @type("number") x: number = 0;
    @type("number") y: number = 0;
}

export class UserSchema extends Schema {
    @type("string") address: string = "";
    @type("number") balance: number = 0;
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
}
