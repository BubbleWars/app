import { Bubble } from "../types/bubble";
import { Attractor, Entity } from "../types/entity";
import { Item, ItemBubble, ItemMasses, ItemObstacle } from "../types/items";
import { Portal } from "../types/portal";
import { ResourceNode } from "../types/resource";
import { WorldState, world } from "../world";
import { getTotalBubbleMass, updateBubble } from "./bubble";
import { getPortalMass, updatePortal } from "./portal";

export const isInInventory = (
    entity: Entity,
    item: Item,
): boolean => {
    const { id } = item;
    return entity.inventory.items
        .some((i) => i.id === id);
}

export const getItemMass = (
    item: Item,
): number => {
    return ItemMasses[item.type] || 0;
}

export const getTotalInventoryMass = (
    entity: Entity,
): number => {
    return entity?.inventory?.items
        .reduce((acc, item) => acc + getItemMass(item), 0);
}

export const addInventoryItem = (
    worldState: WorldState,
    entity: Entity,
    type: 'bubble' | 'portal',
    item: Item,
): boolean => {
    const success = false;
    if (isInInventory(entity, item)) return success;
    
    if(type === 'bubble') {
        const bubble = entity as Bubble;
        bubble.inventory.items.push(item);
        updateBubble(worldState.bubbles, bubble);
    }else if (type == 'portal') {
        const portal = entity as Portal;
        portal.inventory.items.push(item);
        updatePortal(portal, getPortalMass(portal));
    }
    return success;
}

export const removeInventoryItem = (
    worldState: WorldState,
    entity: Entity | Bubble | Portal,
    type: 'bubble' | 'portal',
    item: Item,
): boolean => {
    const success = false;
    if (!isInInventory(entity, item)) return success;
    
    if(type === 'bubble') {
        const bubble = entity as Bubble;
        bubble.inventory.items = bubble.inventory.items
            .filter((i) => i.id !== item.id);
        updateBubble(worldState.bubbles, bubble);
    }else if(type === 'portal') {
        const portal = entity as Portal;
        portal.inventory.items = portal.inventory.items
            .filter((i) => i.id !== item.id);
        updatePortal(portal, getPortalMass(portal));
    }
    
    return success;
}

export const getInventory = (
    entity: Entity | Bubble | Portal,
): Item[] => {
    return entity.inventory.items;
}

export const getEquipped = (
    entity: Entity,
): Item[] => {
    return entity.inventory.equipped;
}

export const setInventory = (
    entity: Entity | Bubble | Portal,
    items: Item[],
): void => {
    entity.inventory.items = items;
}


export const setEquipped = (
    entity: Entity,
    items: Item[],
): void => {
    entity.inventory.equipped = items;
}


export const getInventoryItem = (
    worldState: WorldState,
    entity: Entity | Bubble | Portal,
    id: string,
): Item | undefined => {
    return entity.inventory.items
        .find((i) => i.id === id);
}

export const addAttractor = (
    attractors: Attractor[],
    {to, from}: Attractor
) => {
    return attractors.push({to, from});
}

export const absorbItemBubble = <T>(
    worldState: WorldState,
    type: 'bubble' | 'portal' | 'node',
    entity: Entity | Bubble | Portal | ResourceNode,
    itemBubble: ItemBubble
): boolean => {
    switch (type) {
        case 'bubble':
            //Remove itemBubble from worldState.itemBubbles
            worldState.itemBubbles = worldState.itemBubbles
                .filter((ib) => ib.item.id !== itemBubble.item.id);
            //Add item to entity inventory
            addInventoryItem(worldState, entity, type, itemBubble.item);
            break;
        case 'portal':
            //Remove itemBubble from worldState.itemBubbles
            worldState.itemBubbles = worldState.itemBubbles
                .filter((ib) => ib.item.id !== itemBubble.item.id);
            //Add item to entity inventory
            addInventoryItem(worldState, entity, type, itemBubble.item);
        
            break;
        case 'node':
            //Remove itemBubble from worldState.itemBubbles
            worldState.itemBubbles = worldState.itemBubbles
                .filter((ib) => ib.item.id !== itemBubble.item.id);
            //sell item to node
            //nodeSellItem(worldState, entity, itemBubble.item);
        
            break;
    
        default:
            break;
    }

}

export const absorbItemObstacle = <T>(
    worldState: WorldState,
    type: 'bubble' | 'portal' | 'node',
    entity: Entity | Bubble | Portal | ResourceNode,
    item: ItemObstacle,
): boolean => {
    switch (type) {
        case 'bubble':
            //Add item to entity inventory
            addInventoryItem(worldState, entity, type, item.item);
            break;
        case 'portal':
            //Remove itemBubble from worldState.itemBubbles
            worldState.itemBubbles = worldState.itemBubbles
                .filter((ib) => ib.item.id !== item.item.id);
            //Add item to entity inventory
            addInventoryItem(worldState, entity, type, item.item);
            break;
        case 'node':
            //sell item to node
            //nodeSellItem(worldState, entity, item);
            break;
    
        default:
            break;
    }

}


