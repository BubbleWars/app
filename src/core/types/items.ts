import { Body, BodyDef, Fixture } from 'planck-js';
import { PLANCK_MASS } from '../consts';
import { Entity } from './entity';
import { ObstacleDef } from './obstacle';

export const MAX_ITEMS = 10;
export const MAX_EQUIPPED = 2;
export const EJECTION_SPEED = 2; // 2 m/s

export const MIN_SWORD_DAMAGE = 1;
export const MAX_SWORD_DAMAGE = 10;
export const SHURIKEN_DAMAGE = 1;
export const CHARGE_DAMAGE_PER_SECOND = 1;
export const CHARGE_RANGE_PER_SECOND = 1;

export const SWORD_LENGTH = 3; // 3 m
export const SWORD_SWING_TIME = 2; // 2 seconds
export const SHIELD_ACTIVE_TIME = 5; // 5 seconds

export const SWORD_COOLDOWN = 3; // 1 second
export const SHIELD_COOLDOWN = 5; // 5 seconds
export const SHURIKEN_COOLDOWN = 1; // 1 second
export const STUN_DART_COOLDOWN = 10; // 5 seconds

export const SHURIKEN_SPEED = 10; // 10 m/s
export const SHURIKEN_RADIUS = 1; // 1 m
export const STUN_DART_SPEED = 5; // 5 m/s
export const STUN_DART_RADIUS = 1; // 0.5 m

export enum ItemType {
    SWORD,
    SHIELD,
    SHURIKEN,
    STUN_DART,
}

export const ItemMasses = {
    [ItemType.SWORD]: PLANCK_MASS * 10,
    [ItemType.SHIELD]: PLANCK_MASS * 20,
    [ItemType.SHURIKEN]: PLANCK_MASS * 5,
    [ItemType.STUN_DART]: PLANCK_MASS * 2,
}

export const ItemRadii = {
    [ItemType.SWORD]: 1,
    [ItemType.SHIELD]: 1,
    [ItemType.SHURIKEN]: 1,
    [ItemType.STUN_DART]: 1,
}

export interface ItemState {
    obstacle: boolean;
    bubbled: boolean;
    equipped: boolean;
    using: boolean;
    cooldown: {
        wait: number, // total time to wait before using again 
        started: number, // time when cooldown started
        duration: number, // time has been cooling down for
    } | null;
}

export interface SwordState extends ItemState {
    direction: 0 | 1, // 0 = CW, 1 = CCW
    swinging: { 
        wait: number, // total time to wait before swing is over
        started: number, // time the swing started
        duration: number, // time the swing has been going on for
        
    } | null;
    charge: { 
        started: number,  // time when charge started
        duration: number, // time has been charging
        amount: number,   // amount of charge gained (1 - 5)
    } | null;
}

export interface ShieldState extends ItemState {
    active: {
        wait: number, // total time the shield can be active
        started: number, // time when shield was activated
        duration: number, // time shield has been active for
    } | null;
    direction: { x: number, y: number } | null; // direction shield is facing
}

export interface ItemParams {
    equip: {} | null;
    use: any | null;
    throw: {} | null;
    consume: {} | null;
}

export interface BaseItem {
    id: string;
    type: ItemType;
    equippable: boolean; // Can it be equipped
    usable: boolean; // Can it be used when equipped
    throwable: boolean; // Can it be thrown
    consumable: boolean; // Can it be consumed
    params: ItemParams; // params to pass into func when using this item
    state: ItemState;
}    

export interface SwordItem extends BaseItem {
    type: ItemType.SWORD;
    state: SwordState;
    equippable: true;
    usable: true;
    throwable: false;
    consumable: false;
    params: {
        equip: {},
        use: {
            charge?: { }, // charge up attack
            swing?: { }, // swing sword
        },
        throw: null,
        consume: null,
    };
}

export interface ShieldItem extends BaseItem {
    type: ItemType.SHIELD;
    state: ShieldState;
    equippable: true;
    usable: true;
    throwable: false;
    consumable: false;
    params: {
        equip: { },
        use: { to: { x: number, y: number } }, // move shield to direction
        throw: null,
        consume: null,
    }
}

export interface ShurikenItem extends BaseItem {
    type: ItemType.SHURIKEN;
    equippable: false;
    usable: false;
    throwable: true;
    consumable: false;
    params: {
        equip: {},
        use: null,
        throw: { direction: { x: number, y: number } },
        consume: null,
    }
}

export interface StunDartItem extends BaseItem {
    type: ItemType.STUN_DART;
    equippable: false;
    usable: false;
    throwable: true;
    consumable: true;
    params: {
        equip: {},
        use: null,
        throw: { direction: { x: number, y: number } },
        consume: { },
    }
}

export type Item = SwordItem | ShieldItem | ShurikenItem | StunDartItem | BaseItem;

//When items are ejected from entities, they will be placed in a bubble
export interface ItemBubble {
    item: Item;
    body: Body,
    fixture: Fixture,
}

export interface ItemObstacle {
    item: Item;
    body: Body,
    fixture: Fixture,
}

export interface ItemObstacleDef extends ObstacleDef {
    item: Item;
}

    
export interface Inventory {
    //items with max array length of MAX_ITEMS
    items: Item[];
    //items with max array length of MAX_EQUIPPED
    equipped: Item[];
}