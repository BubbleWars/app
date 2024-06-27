import { Body, Circle, Fixture, Vec2, World } from "planck-js";
import { Bubble } from "../types/bubble";
import { Entity } from "../types/entity";
import { EJECTION_SPEED, Item, ItemBubble, ItemMasses, ItemObstacle, ItemParams, ItemRadii, ItemState, ItemType, MAX_EQUIPPED, SHIELD_ACTIVE_TIME, SHIELD_COOLDOWN, SHURIKEN_COOLDOWN, SHURIKEN_RADIUS, SHURIKEN_SPEED, STUN_DART_COOLDOWN, STUN_DART_RADIUS, STUN_DART_SPEED, SWORD_COOLDOWN, SWORD_SWING_TIME, ShieldItem, ShieldState, SwordItem, SwordState } from "../types/items"
import { WorldState, world } from "../world";
import { isInInventory, removeInventoryItem } from "./entity";
import { setBodyId } from "./obstacle";
import { id } from "ethers";
import { createPunctureInBubble, punctureBubble } from "./bubble";

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

export const isUsing = (
    item: Item,
): boolean => {
    return item.state.using;
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

export const isBubbleShieldActive = (
    entity: Bubble,
): boolean => {
    return entity.inventory.equipped
        .some((item) => item.type === ItemType.SHIELD && item.state.active !== null);
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

    //Set state
    item.state.equipped = true;

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

    //Set state
    item.state.equipped = false;

    return success;
}


export const useItem = (
    worldState: WorldState,
    entity: Bubble,
    item: Item,
    params: ItemParams,
): boolean => {
    const success = false;
    if (!isEquipped(entity, item)) return success;
    if (!isCoolingDown(item)) return success;
    if (!isUsing(item)) return success;
    if (!item.usable) return success;

    //Use item
    item.state.using = true;
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
            break;
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

    //Create item bubble
    const entityRadius = entity.fixture.getShape().getRadius();
    const entityPosition = entity.body.getPosition().clone();
    const itemRadius = ItemRadii[item.type];
    const to = Vec2(direction.x, direction.y).mul(entityRadius + itemRadius).add(entityPosition);
    const velocity = Vec2(direction.x, direction.y).mul(EJECTION_SPEED);
    const itemBubble = createItemBubble(worldState,item, to, velocity);
    worldState.itemBubbles.push(itemBubble);

    //Remove from inventory
    removeInventoryItem(worldState, entity, 'bubble', item);

    //Eject item
    return success;
}


export const createItemBubble = (
    worldState: WorldState,
    item: Item,
    position: { x: number, y: number },
    velocity: { x: number, y: number },
): ItemBubble => {
    const type = item.type;
    const body = worldState.world.createBody({
        type: "dynamic",
        position: Vec2(position.x, position.y),
        linearVelocity: Vec2(velocity.x, velocity.y),
    });
    body.setMassData({ mass: ItemMasses[type], center: Vec2(0, 0), I: 0 });
    const fixture = body.createFixture({shape: Circle(ItemRadii[type])})
    setBodyId(body, item.id);
    
    //Set item state
    item.state.obstacle = false;
    item.state.bubbled = true;
    item.state.using = false;

    //Create bubble
    return {
        item,
        body,
        fixture,
    }
}

export const createItemObstacle = (
    worldState: WorldState,
    item: Item,
    position: { x: number, y: number },
    velocity: { x: number, y: number },
): ItemObstacle => {
    const type = item.type;
    const obstacle: ItemObstacle = {
        item,
        body: {} as Body,
        fixture: {} as Fixture,
    }
    switch (type) {
        case ItemType.SHURIKEN:
            const shurikenBody = worldState.world.createBody({
                type: "dynamic",
                position: Vec2(position.x, position.y),
                linearVelocity: Vec2(velocity.x, velocity.y),
            });
            shurikenBody.setMassData({ mass: ItemMasses[type], center: Vec2(0, 0), I: 0 });
            setBodyId(shurikenBody, item.id);
            const shurikenFixure = shurikenBody.createFixture({
                shape: Circle(SHURIKEN_RADIUS),
                userData: {
                    id: item.id,
                    type: 'shuriken',
                    item: item,
                }
            })
            obstacle.body = shurikenBody;
            obstacle.fixture = shurikenFixure;
            break;
    
        case ItemType.STUN_DART:
            const stunDartbody = worldState.world.createBody({
                type: "dynamic",
                position: Vec2(position.x, position.y),
                linearVelocity: Vec2(velocity.x, velocity.y),
            });
            stunDartbody.setMassData({ mass: ItemMasses[type], center: Vec2(0, 0), I: 0 });
            setBodyId(stunDartbody, item.id);
            const stunDartBody = stunDartbody.createFixture({
                shape: Circle(STUN_DART_RADIUS),
                userData: {
                    id: item.id,
                    type: 'stunDart',
                    item: item,
                }
            })
            obstacle.body = stunDartbody;
            obstacle.fixture = stunDartBody;
            break;
    }

    //Set item state
    item.state.obstacle = true;
    item.state.bubbled = false;
    item.state.using = false;

    return obstacle;
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
    const currentTimestamp = worldState.current;
    item.state.charge = {
        started: currentTimestamp,
        duration: 0,
        amount: 0,
    }
    return success;
}

export const swingSword = (
    worldState: WorldState,
    entity: Bubble,
    item: SwordItem,
): boolean => {
    const success = false;
    if (!isEquipped(entity, item)) return success;
    if (!item.usable) return success;

    //Swing
    item.state.swinging = {
        wait: SWORD_SWING_TIME,
        started: worldState.current,
        duration: 0,
    }

    //Create Sword sensor
    const entityRadius = entity.fixture.getShape().getRadius();
    const swordRadius = ItemRadii[item.type];
    entity.body.createFixture({
        shape: Circle(entityRadius + swordRadius),
        isSensor: true,
        userData: {
            id: item.id,
            type: 'sword',
            item: item,
        }
    })

    //Toggle direction
    item.state.direction = item.state.direction == 0 ? 1 : 0;

    return success;
}

export const useShield = (
    worldState: WorldState,
    entity: Bubble,
    item: ShieldItem,
    direction: { x: number, y: number },
): boolean => {
    const success = false;
    if (!isEquipped(entity, item)) return success;
    if (!item.usable) return success;

    //Activate shield
    item.state.active = {
        wait: SHIELD_ACTIVE_TIME,
        started: worldState.current,
        duration: 0,
    }
    item.state.direction = direction;

    //Use shield
    return success;
}

export const useShuriken = (
    worldState: WorldState,
    entity: Bubble,
    item: Item,
    direction: { x: number, y: number },
): boolean => {
    const success = false;
    if (!isEquipped(entity, item)) return success;
    if (!item.usable) return success;

    //Create item obstacle
    const entityRadius = entity.fixture.getShape().getRadius();
    const entityPosition = entity.body.getPosition().clone();
    const itemRadius = SHURIKEN_RADIUS;
    const to = Vec2(direction.x, direction.y).mul(entityRadius + itemRadius).add(entityPosition);
    const velocity = Vec2(direction.x, direction.y).mul(SHURIKEN_SPEED);
    const shuriken = createItemObstacle(worldState,item, to, velocity);
    worldState.itemObstacles.push(shuriken);

    //Cooldown
    item.state.cooldown = {
        wait: SHURIKEN_COOLDOWN,
        started: worldState.current,
        duration: 0,
    }

    //Remove from inventory
    removeInventoryItem(worldState, entity, 'bubble', item);

    //Use shuriken
    return success;
}

export const useStunDart = (
    worldState: WorldState,
    entity: Bubble,
    item: Item,
    direction: { x: number, y: number },
): boolean => {
    const success = false;
    if (!isEquipped(entity, item)) return success;
    if (!item.usable) return success;

    //Create item obstacle
    const entityRadius = entity.fixture.getShape().getRadius();
    const entityPosition = entity.body.getPosition().clone();
    const itemRadius = STUN_DART_RADIUS;
    const to = Vec2(direction.x, direction.y).mul(entityRadius + itemRadius).add(entityPosition);
    const velocity = Vec2(direction.x, direction.y).mul(STUN_DART_SPEED);
    const stunDart = createItemObstacle(worldState, item, to, velocity);
    worldState.itemObstacles.push(stunDart);

    //Cooldown
    item.state.cooldown = {
        wait: STUN_DART_COOLDOWN,
        started: worldState.current,
        duration: 0,
    }

    //Remove from inventory
    removeInventoryItem(worldState, entity, 'bubble', item);

    //Use stun dart
    return success;
}

export const handleInventory = (
    current: number,
    entity: Bubble,
): boolean => {
    const success = false;
    const inventory = entity.inventory;
    const equipped = inventory.equipped;
    const items = inventory.items;

    //Handle equipped
    equipped.forEach(
        (item) => handleItem(current, item));

    //Handle items
    items.forEach(
        (item) => handleItem(current, item));

    return success;
}

export const handleItem = (
    current: number,
    item: Item,
): boolean => {
    //Check cooldown
    if (item.state.cooldown !== null) {
        const currentTimestamp = current;
        const cooldown = item.state.cooldown;
        const elapsed = currentTimestamp - cooldown.started;
        if (elapsed >= cooldown.wait) {
            item.state.cooldown = null;
        }
    }

    //Check using
    if (item.state.using) {
        const type = item.type;
        switch (type) {
            case ItemType.SWORD:
                const swordState = item.state as SwordState;
                if (swordState.swinging !== null) {
                    const currentTimestamp = current;
                    const swing = swordState.swinging;
                    const elapsed = currentTimestamp - swing.started;
                    if (elapsed >= swing.wait) {
                        swordState.swinging = null;
                        swordState.using = false;
                        //Start cooldown
                        item.state.cooldown = {
                            wait: SWORD_COOLDOWN,
                            started: currentTimestamp,
                            duration: 0,
                        }
                    }
                }
                break;
            case ItemType.SHIELD:
                const shieldState = item.state as ShieldState;
                if (shieldState.active !== null) {
                    const currentTimestamp = current;
                    const active = shieldState.active;
                    const elapsed = currentTimestamp - active.started;
                    if (elapsed >= active.wait) {
                        shieldState.active = null;
                        shieldState.using = false;
                        //Start cooldown
                        item.state.cooldown = {
                            wait: SHIELD_COOLDOWN,
                            started: currentTimestamp,
                            duration: 0,
                        }
                    }
                }
                break;
            case ItemType.SHURIKEN:
                break;
            case ItemType.STUN_DART:
                break;
            default:
                break;
        }
    }
    return true;
}

export const handleItemObstacles = (
    worldState: WorldState,
): boolean => {
    worldState.itemObstacles.forEach(
        (itemObstacle) => handleItemObstacle(worldState, itemObstacle));
    return true;
}

export const handleItemObstacle = (
    worldState: WorldState,
    itemObstacle: ItemObstacle,
): boolean => {
    const item = itemObstacle.item;

    //Once slowed down, remove from world and turn to Item Bubble
    const velocity = itemObstacle.body.getLinearVelocity();
    const speed = velocity.length();
    if (speed <= 0.1) {
        //Remove item obstacle from world
        worldState.itemObstacles = worldState.itemObstacles
            .filter((obstacle) => obstacle.item.id !== item.id);
        //Create item bubble
        const position = itemObstacle.body.getPosition();
        const itemBubble = createItemBubble(worldState, item, position, {x: 0, y: 0});
        worldState.itemBubbles.push(itemBubble);
        
    }

    return true;
    
}

export const getFixtureType = (
    fixture: Fixture,
): 'sword' | 'shield' | 'shuriken' | 'stunDart' | 'normal' => {
    const userData = fixture.getUserData() as any;
    return userData?.type ?? 'normal'
}


//This function is called when a bubble swings a sword and contacts another object
//The object can be a bubble, an obstacle, or a wall
//This two object should essentially bounce off each other
export const generateClashImpulse = (
    b1: Body,
    b2: Body,
): [Vec2, Vec2] => {
    const p1 = b1.getPosition();
    const p2 = b2.getPosition();
    const v1 = b1.getLinearVelocity();
    const v2 = b2.getLinearVelocity();
    const m1 = b1.getMass();
    const m2 = b2.getMass();
    const n = p2.sub(p1);
    n.normalize();
    const v = v2.sub(v1);
    const e = 1;
    const j = (1 + e) * Vec2.dot(v, n) / (1/m1 + 1/m2);
    const impulse = n.mul(j);
    return [impulse, impulse.neg()];
}

export const applyClashImpulse = (
    b1: Body,
    b2: Body,
): boolean => {
    const [impulse1, impulse2] = generateClashImpulse(b1, b2);
    b1.applyLinearImpulse(impulse1, b1.getPosition(), true);
    b2.applyLinearImpulse(impulse2, b2.getPosition(), true);
    return true;
}

export const handleWeaponBubbleContact = (
    worldState: WorldState,
    attacker: Bubble,
    reciever: Bubble,
): boolean => {
    const success = false;
    const sword = attacker.inventory.equipped
        .find((item) => item.type === ItemType.SWORD);
    if (!sword) return success;

    //Check if sword is swinging
    const swordState = sword.state as SwordState;
    if (swordState.swinging === null) return success;

    //Check if reciever has a sword and is swinging
    const recieverSword = reciever.inventory.equipped
        .find((item) => item.type === ItemType.SWORD);
    if (recieverSword){
        const recieverSwordState = recieverSword.state as SwordState;
        if (recieverSwordState.swinging !== null) {
            //Deactivate sword swinging
            recieverSwordState.swinging = null;
            recieverSwordState.using = false;
            //Start cooldown
            recieverSword.state.cooldown = {
                wait: SWORD_COOLDOWN,
                started: worldState.current,
                duration: 0,
            }
            //Apply impulse
            applyClashImpulse(attacker.body, reciever.body);
        }
        return success;
    }

    //Check if reciever has a shield and is active
    const recieverShield = reciever.inventory.equipped
        .find((item) => item.type === ItemType.SHIELD);
    if (recieverShield){
        const recieverShieldState = recieverShield.state as ShieldState;

        //Check if shield is active
        if (recieverShieldState.active !== null) {
            //Deactivate shield
            const currentTimestamp = worldState.current;
            const active = recieverShieldState.active;
            const elapsed = currentTimestamp - active.started;
            if (elapsed >= active.wait) {
                recieverShieldState.active = null;
                recieverShieldState.using = false;
                //Start cooldown
                recieverShield.state.cooldown = {
                    wait: SHIELD_COOLDOWN,
                    started: currentTimestamp,
                    duration: 0,
                }
            }
            //Apply impulse
            applyClashImpulse(attacker.body, reciever.body);
        }
        return success;
    }


    //Otherwise puncture reciever bubble
    const attackerPosition = attacker.body.getPosition();
    const recieverPosition = reciever.body.getPosition();
    const recieverPuncturePoint =  attackerPosition.sub(recieverPosition)
    createPunctureInBubble(
        worldState.bubbles,
        reciever,
        recieverPuncturePoint,
        worldState.current,
        1,
        0
    )

    applyClashImpulse(attacker.body, reciever.body);

    return success;
}


//Collision response when weapon contacts anything but bubble
//No attack logic here, just bounce off
export const handleWeaponObjectContact = (
    worldState: WorldState,
    attacker: Body,
    reciever: Body,
): boolean => {
    applyClashImpulse(attacker, reciever);
    return true;
}

    

