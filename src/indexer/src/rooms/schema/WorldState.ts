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

export class ItemSchema extends Schema {
    //Base ItemState
    @type("boolean") obstacle: boolean = false;
    @type("boolean") bubbled: boolean = false;
    @type("boolean") equipped: boolean = false;
    @type("boolean") using: boolean = false;
    @type("number") cooldownWait: number = 0;
    @type("number") cooldownStarted: number = 0;
    @type("number") cooldownDuration: number = 0;

    //Sword ItemState
    @type("number") swordDirection: number = 0;
    @type("number") swordSwingingWait: number = 0;
    @type("number") swordSwingingStarted: number = 0;
    @type("number") swordSwingingDuration: number = 0;
    @type("number") swordChargeStarted: number = 0;
    @type("number") swordChargeDuration: number = 0;
    @type("number") swordChargeAmount: number = 0;

    //Shield ItemState
    @type("number") shieldActiveWait: number = 0;
    @type("number") shieldActiveStarted: number = 0;
    @type("number") shieldActiveDuration: number = 0;
    @type("number") shieldDirectionX: number = 0;
    @type("number") shieldDirectionY: number = 0;

    //BaseItem 
    @type("string") id: string = "";
    @type("number") type: number = 0;
    @type("boolean") equippable: boolean = false;
    @type("boolean") usable: boolean = false;
    @type("boolean") throwable: boolean = false;
    @type("boolean") consumable: boolean = false;
    
}

export class ItemBubbleStateSchema extends Schema {
    @type(ItemSchema) item = new ItemSchema();
    @type(Vector2Schema) position = new Vector2Schema();
    @type(Vector2Schema) velocity = new Vector2Schema();
}

export class ItemObstacleStateSchema extends Schema {
    @type(ItemSchema) item = new ItemSchema();
    @type(Vector2Schema) position = new Vector2Schema();
    @type(Vector2Schema) velocity = new Vector2Schema();
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

    //Inventory
    @type([ItemSchema]) inventory = new ArraySchema<ItemSchema>();
    @type([ItemSchema]) equipped = new ArraySchema<ItemSchema>();
}

export class PortalStateSchema extends Schema {
    @type("string") id: string = "";
    @type("string") owner: string = "";
    @type("number") positionX: number = 0;
    @type("number") positionY: number = 0;
    @type("number") mass: number = 0;
    @type([EntityResourceStateSchema]) resources =
        new ArraySchema<EntityResourceStateSchema>();

    //Inventory
    @type([ItemSchema]) inventory = new ArraySchema<ItemSchema>();
    @type([ItemSchema]) equipped = new ArraySchema<ItemSchema>();
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
    @type({ map: ItemBubbleStateSchema }) itemBubbles = new MapSchema<ItemBubbleStateSchema>();
    @type({ map: ItemObstacleStateSchema }) itemObstacles = new MapSchema<ItemObstacleStateSchema>();
}
