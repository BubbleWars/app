import { Entity } from "../types/entity";
import { Item, ItemBubble, ItemObstacle, ItemParams, ItemType, MAX_EQUIPPED, ShieldItem, SwordItem } from "../types/items"
import { WorldState } from "../world";
import { isInInventory } from "./entity";

export const isEquipped = (
    entity: Entity,
    item: Item,
): boolean => {
    return entity.inventory.equipped
        .some((i) => i.id == item.id);
}

export const isCoolingDown = (
    item: Item,
): boolean => {
    return item.state.cooldown !== null;
}

export const isCharging = (
    item: SwordItem,
): boolean => {
    return item.state.charge !== null;
}

export const isMaxEquipped = (
    entity: Entity,
): boolean => {
    return entity.inventory.equipped.length >= MAX_EQUIPPED;
}

export const equipItem = (
    worldState: WorldState,
    entity: Entity,
    item: Item,
): boolean => {
    const success = false;
    if (!isInInventory(entity, item)) return success;
    if (isEquipped(entity, item)) return success;
    if (!isMaxEquipped(entity)) return success;
    if (!item.equippable) return success;

    //Add to equipped
    entity.inventory.equipped.push(item);

    //remove from inventory
    entity.inventory.items = entity.inventory.items
        .filter((i) => i.id !== item.id);

    return success;
}

export const unequipItem = (
    worldState: WorldState,
    entity: Entity,
    item: Item,
): boolean => {
    const success = false;
    if (!isEquipped(entity, item)) return success;


    //remove from equipped
    entity.inventory.equipped = entity.inventory.equipped
        .filter((i) => i.id !== item.id);

    //add back to inventory
    entity.inventory.items.push(item);
    return success;
}


export const useItem = (
    worldState: WorldState,
    entity: Entity,
    item: Item,
    params: ItemParams,
): boolean => {
    const success = false;
    if (!isEquipped(entity, item)) return success;
    if (!item.usable) return success;

    //Use item
    switch (item.type) {
        case ItemType.SWORD:
            const isCharge = params?.use?.charge !== undefined;
            const isSwing = params?.use?.swing !== undefined;
            if (isCharge) chargeSword(worldState, entity, item as SwordItem);
            else if (isSwing) swingSword(worldState, entity, item as SwordItem);
            break;
        case ItemType.SHIELD:
            const to = params?.use?.to;
            useShield(worldState, entity, item as ShieldItem, to);
            break;
        case ItemType.SHURIKEN:
            const direction = params?.use?.direction;
            useShuriken(worldState, entity, item, direction);
            break;
        case ItemType.STUN_DART:
            const dir = params?.use?.direction;
            useStunDart(worldState, entity, item, dir);
            break;
        default:
    }
    return success;
}

export const ejectItem = (
    worldState: WorldState,
    entity: Entity,
    item: Item,
    direction: { x: number, y: number },
): boolean => {
    const success = false;
    if (!isInInventory(entity, item)) return success; //Item must be in inventory
    if (isEquipped(entity, item)) return success; //Unequip first

    //Eject item
    return success;
}

export const createItemBubble = (
    worldState: WorldState,
    entity: Entity,
    item: Item,
): ItemBubble | null => {
    const success = false;

    //Create bubble
    return success;
}

export const createItemObstacle = (
    worldState: WorldState,
    entity: Entity,
    item: Item,
): ItemObstacle => {
    const success = false;
    return success;
}

export const chargeSword = (
    worldState: WorldState,
    entity: Entity,
    item: SwordItem,
): boolean => {
    const success = false;
    if (!isEquipped(entity, item)) return success;
    if (!isCoolingDown(item)) return success;
    if (!isCharging(item)) return success; 
    if (!item.usable) return success;

    //Charge sword
    const currentTimestamp = worldState.timestamp;
    item.state.charge = {
        started: currentTimestamp,
        duration: 0,
        amount: 0,
    }
    return success;
}

export const swingSword = (
    worldState: WorldState,
    entity: Entity,
    item: SwordItem,
): boolean => {
    const success = false;
    if (!isEquipped(entity, item)) return success;
    if (!item.usable) return success;

    //Swing sword
    item.state.charge = null;
    return success;
}

export const useShield = (
    worldState: WorldState,
    entity: Entity,
    item: ShieldItem,
    direction: { x: number, y: number },
): boolean => {
    const success = false;
    if (!isEquipped(entity, item)) return success;
    if (!item.usable) return success;

    //Use shield
    return success;
}

export const useShuriken = (
    worldState: WorldState,
    entity: Entity,
    item: Item,
    direction: { x: number, y: number },
): boolean => {
    const success = false;
    if (!isEquipped(entity, item)) return success;
    if (!item.usable) return success;

    //Use shuriken
    return success;
}

export const useStunDart = (
    worldState: WorldState,
    entity: Entity,
    item: Item,
    direction: { x: number, y: number },
): boolean => {
    const success = false;
    if (!isEquipped(entity, item)) return success;
    if (!item.usable) return success;

    //Use stun dart
    return success;
}

