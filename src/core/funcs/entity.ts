import { Bubble } from "../types/bubble";
import { Attractor, Entity } from "../types/entity";
import { Item, ItemMasses } from "../types/items";
import { Portal } from "../types/portal";
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

export const addAttractor = (
    attractors: Attractor[],
    {to, from}: Attractor
) => {
    return attractors.push({to, from});
}

