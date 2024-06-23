import { BodyDef } from 'planck-js';
import { PLANCK_MASS } from '../consts';
import { Entity } from './entity';
import { ObstacleDef } from './obstacle';

export const MAX_ITEMS = 10;
export const MAX_EQUIPPED = 2;

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

export interface ItemState {
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
        wait: number, // total time to wait before swinging again
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
    id: number;
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
export interface ItemBubble extends Entity {
    item: Item;
}

export interface ItemObstacle extends ObstacleDef {
    item: Item;
}

export interface Inventory {
    //items with max array length of MAX_ITEMS
    items: Item[];
    //items with max array length of MAX_EQUIPPED
    equipped: Item[];
}