import { PLANCK_MASS } from '../consts';
import { Entity } from './entity';

const MAX_ITEMS = 10;
const MAX_EQUIPPED = 2;

export enum ItemType {
    SWORD,
    SHIELD,
}

export const ItemMasses = {
    [ItemType.SWORD]: PLANCK_MASS * 10,
    [ItemType.SHIELD]: PLANCK_MASS * 20,
}

export interface ItemState {
    inBubble: boolean;
    equipped: boolean;
    using: boolean;
}

export interface ItemParams {
    equip: {} | null;
    use: {} | null;
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
    equippable: true;
    usable: true;
    throwable: false;
    consumable: false;
    params: {
        equip: { direction: { x: number, y: number } }, // equip sword in direction
        use: { angle: number }, // swing sword by angle
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
        equip: { direction: { x: number, y: number } }, // equip shield in direction
        use: { angle: number }, // block by angle
        throw: null,
        consume: null,
    }
}

export type Item = SwordItem | ShieldItem | BaseItem;

//When items are ejected from entities, they will be placed in a bubble
export interface ItemBubble extends Entity {
    item: Item;
}

export interface Inventory {
    //items with max array length of MAX_ITEMS
    items: Item[];
    //items with max array length of MAX_EQUIPPED
    equipped: number[]
}