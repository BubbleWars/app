import { Contact } from "planck-js";
import { STEP_DELTA } from "../consts";
import { Address } from "../types/address";
import { Bubble } from "../types/bubble";
import { Input, InputWithExecutionTime } from "../types/inputs";
import { Obstacle } from "../types/obstacle";
import { Portal } from "../types/portal";
import { Snapshot } from "../types/state";
import { User } from "../types/user";
import { portals, bubbles, deferredUpdates } from "../world";
import { portalAbsorbBubble } from "./portal";
import { absorbBubble } from "./bubble";

export const updateState = (
    state: Snapshot, 
    pendingInputs: Array<InputWithExecutionTime>,
    users: Map<Address, User>, 
    bubbles: Map<string, Bubble>, 
    portals: Map<string, Portal>, 
    obstacles: Map<string, Obstacle>,
    timestamp: number,
) => {
    state.timestamp = timestamp
    state.pendingInputs = pendingInputs
    state.users = Array.from(users.values())
        .map(user => ({
            address: user.address,
            balance: user.balance,
        }))
    state.bubbles = Array.from(bubbles.values())
        .map(bubble => ({
            id: bubble.body.getUserData() as string,
            owner: bubble.owner,
            position: bubble.body.getPosition().clone(),
            velocity: bubble.body.getLinearVelocity().clone(),
            mass: bubble.body.getMass(),
        }))
    state.portals = Array.from(portals.values())
        .map(portal => ({
            id: portal.body.getUserData() as string,
            owner: portal.owner,
            position: portal.body.getPosition().clone(),
            mass: portal.mass,
        }))
    state.obstacles = Array.from(obstacles.values())
        .map(obstacle => ({
            id: obstacle.body.getUserData() as string,
            position: obstacle.body.getPosition().clone(),
            velocity: obstacle.body.getLinearVelocity().clone(),
            vertices: obstacle.vertices,
        }))
    
}

export const createState = (
    pendingInputs: Array<InputWithExecutionTime>,
    users: Map<Address, User>, 
    bubbles: Map<string, Bubble>, 
    portals: Map<string, Portal>, 
    obstacles: Map<string, Obstacle>,
    timestamp: number,
): Snapshot => {
    const state: Snapshot = {
        timestamp: 0,
        pendingInputs: [],
        users: [],
        bubbles: [],
        portals: [],
        obstacles: [],
    }
    updateState(state, pendingInputs, users, bubbles, portals, obstacles, timestamp);
    return state;
}

export const getStatePayload = (state: Snapshot): string => {
    return JSON.stringify(state)
}

export const handleContact = (contact: Contact) => {
    const p1 = portals.get(contact.getFixtureA().getBody().getUserData() as string);
    const p2 = portals.get(contact.getFixtureB().getBody().getUserData() as string);
    const b1 = bubbles.get(contact.getFixtureA().getBody().getUserData() as string);
    const b2 = bubbles.get(contact.getFixtureB().getBody().getUserData() as string);

    //Portal-Bubble collision
    if(p1 && b2) {
        deferredUpdates.push(() => { portalAbsorbBubble(p1, b2, STEP_DELTA) });
    }else
    if(p2 && b1) {
        deferredUpdates.push(() => { portalAbsorbBubble(p2, b1, STEP_DELTA) });
    }else

    //Bubble-Bubble collision
    if(b1 && b2) {
        const m1 = b1?.body.getMass();
        const m2 = b2?.body.getMass();
        if(m1 > m2) {
            deferredUpdates.push(() => { absorbBubble(b1, b2, STEP_DELTA) });
        }else if(m2 > m1) {
            deferredUpdates.push(() => { absorbBubble(b2, b1, STEP_DELTA) });
        }
    }else

    //Bubble-Obstacle collision
    if(b1 && !b2) {
        contact.setRestitution(1);
    }else
    if(b2 && !b1) {
        contact.setRestitution(1);
    }
}