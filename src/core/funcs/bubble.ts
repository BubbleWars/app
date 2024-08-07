import { Circle, Vec2, World } from "planck-js";
import { Bubble, PuncturePoint } from "../types/bubble";
import { calculateDeltaVelocity, calculateEjectionVelocity, calculateEmissionVelocity, massToRadius } from "./utils";
import { Address } from "../types/address";
import { CLASH_KE, CLASH_VELOCITY, DAMPENING, EMISSION_SPEED, MASS_PER_SECOND, PLANCK_MASS } from "../consts";
import { RESOURCE_MASS, Resource, ResourceNode, ResourceType } from "../types/resource";
import { clamp, createResource, getEntity, getNearestNodeToPosition, resourceAmountToMass, resourceMassToAmount, resourceMassToRadius, rotateVec2, updateResource } from "./resource";
import { addEvent } from "./events";
import { EventsType } from "../types/events";
const ZeroAddress = "0x0000000000000000000000000000000000000000";
import { BubbleState } from "../types/state";
import { pseudoRandom } from "./portal";
import { bubbles, pendingInputs, users } from "../world";
import { get } from "http";
import { snapshotPendingInputs } from "../snapshots";
import { InputType } from "../types/inputs";
import { timeStamp } from "console";
import { AssetType, Protocol } from "../types/protocol";
import { getTotalInventoryMass } from "./entity";
import { getBodyId } from "./obstacle";
import { getUser } from "./inputs";
import { User } from "../types/user";

//const PUNCTURE_EMIT_PER_SECOND = 100;


export const generateBubbleId = (
    bubbles: Map<string, Bubble>,
    owner: Address,
): string => {
    //loop through all the bubbles owned by the owner and return the next available id by getting the highest number "bubble-<number>"
    let max = 0;
    bubbles.forEach((value: Bubble, key: string) => {
        if (value.owner == owner) {
            const split = key.split("-");
            const number = parseInt(split[split.length - 1]);
            if (number > max) max = number;
        }
    });

    return `${owner.toLowerCase()}-${max + 1}`;
};

//Get mass of the bubble, ETH + resources
export const getTotalBubbleMass = (bubble: Bubble): number => {
    return bubble.body.getMass();
}

//Set mass in ETH of the bubble
export const setBubbleEthMass = (bubble: Bubble, mass: number): void => {
    if(mass <= 0) {
       //console.log("Setting mass to <= 0");
    }
    bubble.balance = mass;
    updateBubble(bubbles, bubble);
}

//Get mass in ETH of the bubble
export const getBubbleEthMass = (bubble: Bubble): number => {
    const totalMass = getTotalBubbleMass(bubble);
    const resourceMass = getTotalResourceMass(bubble);
    return totalMass - resourceMass;
};

export const getTotalResourceMass = (bubble: Bubble): number => {
    if (!bubble.resources) return 0;
    let total = 0;
    bubble.resources.forEach((resource) => {
        total += resource.mass * PLANCK_MASS;
    });
    return total;
}

export const getBubbleResourceMass = (
    bubble: Bubble,
    resource: ResourceType,
): number => {
    if (!bubble.resources) return 0;
    if (!bubble.resources.has(resource)) return 0;
    const bubbleResource = bubble.resources?.get(resource);
    return bubbleResource?.mass || 0;
};

export const getBubbleStateResourceMass = (
    bubble: BubbleState,
    resource: ResourceType,
): number => {
    if (!bubble.resources) return 0;
    if (!bubble.resources?.find((r) => r.resource == resource)) return 0;
    const bubbleResource = bubble.resources?.find((r) => r.resource == resource);
    return bubbleResource?.mass || 0;
}

export const setBubbleResourceMass = (
    bubble: Bubble,
    resource: ResourceType,
    mass: number,
): void => {
    //console.log("404::setBubbleResourceMass", bubble.resources, resource, mass)
    if (!bubble.resources) bubble.resources = new Map();
    const bubbleResource = bubble.resources?.get(resource);
    if (!bubbleResource) bubble.resources.set(resource, { resource, mass });
    bubble.resources.set(resource, { resource, mass });
    //console.log("setting resource mass", mass)
    updateBubble(bubbles, bubble);
};

export const addBubbleResourceMass = (
    bubble: Bubble,
    resource: ResourceType,
    mass: number,
): void => {
    const currentMass = getBubbleResourceMass(bubble, resource);
    setBubbleResourceMass(bubble, resource, currentMass + mass);
}


export const createBubble = (
    timestamp: number,
    bubbles: Map<string, Bubble>,
    world: World,
    owner: Address,
    x: number,
    y: number,
    mass: number,
    controllable: boolean,
    id?: string,
    bubbleState?: BubbleState,
    from?: string
): Bubble => {
    if (mass <= 0) {
       //console.log("Cannot create bubble with mass <= 0");
        return;
    }
    const radius = massToRadius(mass);
    if (owner == ZeroAddress)
        throw new Error("Cannot create bubble with zero address");
    const body = world.createBody({
        position: Vec2(x, y),
        type: "dynamic",
        linearDamping: DAMPENING,
    });
    const fixture = body.createFixture({
        shape: Circle(radius),
        density: 1,
        restitution: 0,
        friction: 0,
    });
    const bubble: Bubble = { owner, balance: mass, body, fixture, controllable, from: from ?? "" };
    //set id
    if (id) bubble.body.setUserData(id);
    else bubble.body.setUserData(generateBubbleId(bubbles, owner));
    bubbles.set(bubble.body.getUserData() as string, bubble);
    //    //console.log('new event creating bubble', {
    //         owner,
    //         balance: 0,
    //         position: {x, y},
    //         controllable,
    //     })

    if (bubbleState) {
        bubble.lastPunctureEmit = bubbleState.lastPunctureEmit;

        if (!bubble.punctures) bubble.punctures = new Map();
        bubbleState.punctures.forEach(({ point, puncture }) => {
            bubble.punctures?.set(point, puncture);
        });

        bubble.attractor = bubbleState.attractor;
    }

    // addEvent({
    //     type: EventsType.CreateBubble,
    //     id: bubble.body.getUserData() as string,
    //     timestamp,
    //     position: { x, y },
    // });
    setBubbleEthMass(bubble, mass);
    //console.log("bubble created", bubble.body.getUserData() as string)
   //console.log("bubble created with mass:", mass)

//   //console.log("bubble created at position: ", x, y);
//    if(x == undefined || y == undefined) {
//        //console.log("bubble created at undefined position");
//    }
    return bubble;
};

export const bubbleRemoveEth = (
    bubble: Bubble,
    amount: number,
    timestamp: number,
): void => {
    const newEthMass = getBubbleEthMass(bubble) - amount;
    setBubbleEthMass(bubble, newEthMass);
}

export const destroyBubble = (
    bubbles: Map<string, Bubble>,
    bubble: Bubble,
    timestamp?: number,
): void => {
    addEvent({
        type: EventsType.DestroyBubble,
        id: bubble.body.getUserData() as string,
        timestamp: timestamp ?? 0,
        position: {
            x: bubble.body.getPosition().x,
            y: bubble.body.getPosition().y,
        },
        blockNumber: 0,
    });
   //console.log("destroying bubble ");
    bubbles.delete(bubble.body.getUserData() as string);
    bubble.body.getWorld().destroyBody(bubble.body);
    bubble = null as any;
}

export const updateBubble = (
    bubbles: Map<string, Bubble>,
    bubble: Bubble,
    timestamp?: number,
): void => {
    const newEthMass = bubble.balance ?? 0;
    const newResourceMass = getTotalResourceMass(bubble);
    //const newInventoryMass = getTotalInventoryMass(bubble);
    const newMass = newEthMass + newResourceMass;

    //Check if should DESTROY bubble
    if (newMass <= 0 || newEthMass <= 0) {
        destroyBubble(bubbles, bubble, timestamp);
    }

    //Set bubble MASS
    bubble.body.setMassData({ mass: newMass, center: Vec2(0, 0), I: 0 });

    //Set bubble RADIUS
    const radius = massToRadius(bubble.body.getMass());
    bubble.body.destroyFixture(bubble.fixture);
    bubble.fixture = bubble.body.createFixture({
        shape: Circle(radius),
        density: 1,
        restitution: 0,
        friction: 0,
    });
};

//This emits a bubble from a bubble
export const emitBubble = (
    timestamp: number,
    bubbles: Map<string, Bubble>,
    bubble: Bubble,
    mass: number,
    direction: Vec2,
    emissionDirection?: Vec2,
    isPuncture: boolean = false,
): Bubble => {
    //if(!bubble.controllable) throw new Error("Cannot emit from a non-controllable bubble");
    const bubbleEthMass = getBubbleEthMass(bubble);
    if (mass > bubbleEthMass){
       //console.log("Cannot emit more than of the bubble's mass");
        return;
    }
    //console.log("emitting bubble", mass, bubble.body.getMass() );
    const radius = bubble?.fixture?.getShape()?.getRadius() ?? 0;
    const emittedBubbleRadius = massToRadius(mass);
    const centerDelta = direction.clone().mul(radius + emittedBubbleRadius);
    const emittedBubblePosition = bubble.body
        .getPosition()
        .clone()
        .add(centerDelta);
    const emittedBubble = createBubble(
        timestamp,
        bubbles,
        bubble.body.getWorld(),
        bubble.owner,
        emittedBubblePosition.x,
        emittedBubblePosition.y,
        mass,
        false,
        undefined,
        undefined,
        bubble.body.getUserData() as string,
    );

    //console.log("emittedBubble", emittedBubble);
    //Apply mass conservation
    const newBubbleEthMass = bubbleEthMass - mass;
    setBubbleEthMass(bubble, newBubbleEthMass);
    //updateBubble(bubbles, bubble, newBubbleMass);

    //Apply momentum conservation
    //const emittedBubbleVelocityDirection = emissionDirection ? emissionDirection.clone() : direction.clone();
    //const emittedBubbleVelocityMagnitude = calculateEmissionVelocity(newBubbleMass, mass);
    const emittedBubbleRelativeVelocity = calculateEjectionVelocity(emissionDirection ? emissionDirection.add(direction) : direction);
    const emittedBubbleVelocity = bubble.body
        .getLinearVelocity()
        .clone()
        .add(emittedBubbleRelativeVelocity)
        .mul(isPuncture ? 0.5 : 1);

    emittedBubble.body.setLinearVelocity(emittedBubbleVelocity);
    const m = getTotalBubbleMass(bubble);
    const me = emittedBubble.body.getMass();
    const deltaVelocity = calculateDeltaVelocity(emittedBubbleRelativeVelocity, m, me).mul(isPuncture ? 0.5 : 1);
    bubble.body.applyLinearImpulse(deltaVelocity.clone().mul(bubble.body.getMass()), bubble.body.getPosition(), true);

    if(isPuncture)
        addEvent({
            type: EventsType.PunctureEmit,
            puncturerAddress: bubble.owner,
            puncturedAddress: bubble.owner,
            amount: mass,
            timestamp,
            blockNumber: 0,
        })
    else addEvent({
        type: EventsType.EmitBubble,
        userAddress: bubble.owner,
        amount: mass,
        fromPortal: false,
        timestamp,
        blockNumber: 0,
        hash: "0",
        sender: bubble.owner,
    })
    return emittedBubble;
};

export const emitResource = (
    timestamp: number,
    world: World,
    bubbles: Map<string, Bubble>,
    resources: Map<string, Resource>,
    bubble: Bubble,
    resourceType: ResourceType,
    mass: number,
    direction: Vec2,
): Resource => {
   //console.log("emitting resource")
    if (mass > getBubbleResourceMass(bubble, resourceType)){
       //console.log("Cannot emit more than the bubble's resource mass");
        return;
    }
    //console.log("emitting resource", resourceType, mass, getBubbleResourceMass(bubble, resourceType));
    const radius = bubble.fixture.getShape().getRadius();
    const emittedResourceRadius = resourceMassToRadius(resourceType, mass);
    const centerDelta = direction.clone().mul(radius + emittedResourceRadius);
    const emittedResourcePosition = bubble.body
        .getPosition()
        .clone()
        .add(centerDelta);
    const emittedResource = createResource(
        timestamp,
        world,
        resources,
        resourceType,
        emittedResourcePosition.x,
        emittedResourcePosition.y,
        mass,
        bubble.body.getUserData() as string,
    );
    const totalMomentum = bubble.body
        .getLinearVelocity()
        .clone()
        .mul(bubble.body.getMass());

    setBubbleResourceMass(
        bubble,
        resourceType,
        getBubbleResourceMass(bubble, resourceType) - mass,
    );

    //const newBubbleMass = getBubbleMass(bubble);
    //updateBubble(bubbles, bubble, newBubbleMass);

    //Apply momentum conservation
    const originalBubbleMomentum = totalMomentum.clone();
    const emittedResourceVelocityDirection = direction.clone();
    const emittedResourceVelocityMagnitude = CLASH_VELOCITY * 1.5;
    const emittedResourceRelativeVelocity =
        emittedResourceVelocityDirection.mul(emittedResourceVelocityMagnitude);
    const emittedResourceVelocity = bubble.body
        .getLinearVelocity()
        .clone()
        .add(emittedResourceRelativeVelocity);
    const emittedResourceMomentum = emittedResourceVelocity
        .clone()
        .mul(emittedResource.body.getMass());
    emittedResource.body.setLinearVelocity(emittedResourceVelocity);
    bubble.body.setLinearVelocity(
        originalBubbleMomentum
            .sub(emittedResourceMomentum)
            .mul(1 / bubble.body.getMass()),
    );

    //Add event
    addEvent({
        type: EventsType.EmitResource,
        userAddress:  bubble.owner,
        amount: mass,
        fromPortal: false,
        timestamp,
        blockNumber: 0
    })

    
    return emittedResource;
};

export const absorbBubble = (
    bubbles: Map<string, Bubble>,
    bubble: Bubble,
    absorbedBubble: Bubble,
    timeElapsed: number,
): void => {
    const absorbedEthMass = getBubbleEthMass(absorbedBubble);
    const absorbedTotalMass = getTotalBubbleMass(absorbedBubble);
    const newBubbleEthMass = getBubbleEthMass(bubble) + absorbedEthMass;
    const newTotalMass = getTotalBubbleMass(bubble) + absorbedTotalMass;
    const absorbedResourceAmount = getBubbleResourceMass(absorbedBubble, ResourceType.ENERGY);

    //Transfer resources to bubble
    if (absorbedBubble.resources) {
        absorbedBubble.resources.forEach((resource) => {
            addBubbleResourceMass(bubble, resource.resource, resource.mass);
        });
    }

    //Transfer ETH to bubble
    setBubbleEthMass(bubble, newBubbleEthMass);
    destroyBubble(bubbles, absorbedBubble);

    

    //Transfer momentum to bubble
    if (bubble.body.isDynamic()){
        const momentumAbsorbed = absorbedBubble.body.getLinearVelocity().clone().mul(absorbedTotalMass);
        const newBubbleMomentum = bubble.body.getLinearVelocity().clone().mul(bubble.body.getMass()).add(momentumAbsorbed);
        bubble.body.setLinearVelocity(newBubbleMomentum.mul(1 / newTotalMass));
    }

    //Emit event
    addEvent({
        type: EventsType.AbsorbBubble,
        absorber: bubble.owner,
        absorbed: absorbedBubble.owner,
        absorbedResourceAmount,
        absorberEntityId: getBodyId(bubble.body),
        amount: absorbedTotalMass,
        timestamp: 0,
        blockNumber: 0,
    });
};


export const transferResourceToBubble = (
    bubbles: Map<string, Bubble>,
    resources: Map<string, Resource>,
    bubble: Bubble,
    absorbedResource: Resource,
    timestamp: number = 0,
) => {
    const amount = resourceMassToAmount(absorbedResource.resource, absorbedResource.body.getMass());
    const type = absorbedResource.resource;

    const prev = getBubbleResourceMass(bubble, type);
    const now = prev + amount;
    setBubbleResourceMass(bubble, type, now);
    updateResource(resources, absorbedResource, 0, timestamp);
}

export const addPuncturePoint = (
    bubble: Bubble,
    puncturePoint: PuncturePoint,
    amount: number,
    start: number,
) => {
    if (!bubble.punctures) bubble.punctures = new Map();
    if (!bubble.punctures.has(puncturePoint)) {
        bubble.punctures.set(puncturePoint, { amount, start });
    } else {
        const puncture = bubble.punctures.get(puncturePoint);
        if (puncture) puncture.amount += amount;
    }

    //Emit event
}

export const subtractPuncturePoint = (
    bubble: Bubble,
    puncturePoint: PuncturePoint,
    amount: number,
) => {
    if (!bubble.punctures) return;
    if (!bubble.punctures.has(puncturePoint)) return;
    const puncture = bubble.punctures.get(puncturePoint);
    if (puncture) puncture.amount -= amount;
}



export const isResourceActivated = (vx: number, vy: number) => {
    const v = Math.sqrt(vx * vx + vy * vy);
    //console.log("magnitude of velocity", v, vx, vy)
    return v > CLASH_VELOCITY;

}

export const addUserPoints = (
    users: Map<string, User>,
    address: Address,
    points: number,
) => {
    const user = users.get(address);
    if (!user) return;
    user.points += points;
    users.set(address, user);
}


export const absorbResource = (
    users: Map<string, User>,
    bubbles: Map<string, Bubble>,
    resources: Map<string, Resource>,
    nodes: Map<string, ResourceNode>,
    protocol: Protocol,
    bubble: Bubble,
    absorbedResource: Resource,
    timeElapsed: number,
    timestamp: number,
    isSnapshot: boolean = false,
): void => {
    const amount = resourceMassToAmount(absorbedResource.resource, absorbedResource.body.getMass());
    const owner = bubble.owner;
    addUserPoints(users, owner, amount);

    // //Transfer resource to bubble
    // const resourceType = absorbedResource.resource;
    // switch (resourceType) {    
    //     case ResourceType.ENERGY:
    //         //Check kinetic energy for PUNCTURE
    //         const { x, y } = absorbedResource.body.getLinearVelocity();
    //         if(isResourceActivated(x, y)){
    //             //console.log("resource is activated", absorbedResource.body.getLinearVelocity().length());
    //             punctureBubble(bubbles, resources, nodes, protocol, bubble, absorbedResource, timestamp, isSnapshot);
    //             break;
    //         }
    //         //Transfer RED to bubble
    //         transferResourceToBubble(bubbles, resources, bubble, absorbedResource, timestamp);
    //         break;
    // }

    // //Transfer momentum to bubble
    // if (bubble.body.isDynamic()){
    //     const resourceMomentum = absorbedResource.body.getLinearVelocity().clone().mul(absorbedResource.body.getMass());
    //     const totalMomentum = bubble.body.getLinearVelocity().clone().mul(bubble.body.getMass());
    //     const newBubbleMomentum = totalMomentum.add(resourceMomentum);
    //     bubble.body.setLinearVelocity(newBubbleMomentum.mul(1 / bubble.body.getMass()));
    // } 

    // //Destroy the absorbed resource
    updateResource(resources, absorbedResource, 0, timestamp);
    
    //Emit event
    // addEvent({
    //     type: EventsType.AbsorbResource,
    //     absorber: bubble.owner,
    //     absorberEntityId: getBodyId(bubble.body),
    //     amount: resourceMassToAmount(absorbedResource.resource, absorbedResource.body.getMass()),
    //     timestamp,
    //     blockNumber: 0,
    // });

};

/**
* Logistic Function Growth
 * Asymptotically approaches MAX as x increases.
 * Ignores values of x less than 0 by returning 0.
 */
export const  calculatePunctureEthAmount = (
    mass: number, //ETH mass of the bubble
    attack: number, //Incoming attack resoiiiiikioop'urce mass
    defense: number, //Bubble defense resource mass
) => {
    const x = attack - defense;
    if (x <= 0) return 0;
    const max = mass / 10;

    const k = 1;
    const x0 = 5;

    return max / (1 + Math.exp(-k * (x - x0)));
}

export const punctureBubble = (
    bubbles: Map<string, Bubble>,
    resources: Map<string, Resource>,
    nodes: Map<string, ResourceNode>,
    protocol: Protocol,
    bubble: Bubble,
    incoming: Resource,
    timestamp: number,
    isSnapshot: boolean = false,
): void => {
    //Make sure the incoming resource is RED
    if(incoming.resource != ResourceType.ENERGY) return;

    //Get the defense and attack values
    const defense = getBubbleResourceMass(bubble, ResourceType.ENERGY);
    const attack = resourceMassToAmount(incoming.resource, incoming.body.getMass());

    //Puncture the bubble
    const puncturePoint = incoming.body
        .getPosition().clone()
        .sub(bubble.body.getPosition())
    puncturePoint.normalize();

    //Calculate puncture amount
    const amount = calculatePunctureEthAmount(
        getBubbleEthMass(bubble), 
        attack, 
        defense
    );

    const amountToBurn = attack + clamp(attack, 0, defense);
    const nodeToBurnFrom = getNearestNodeToPosition(incoming.body.getPosition(), nodes);
    //if (nodeToBurnFrom) {
        protocol.deposit(AssetType.ENERGY, amountToBurn);
       //console.log("Send EP to protocol")
    //} else{
    //   //console.log("No node to burn from");
    //}


   //console.log("puncturing bubble", amount, defense, attack, amountToBurn, nodeToBurnFrom?.id, incoming.body.getPosition().x, incoming.body.getPosition().y, bubble.body.getPosition().x, bubble.body.getPosition().y);

    //Emit event
    addEvent({
        type: EventsType.PunctureBubble,
        puncturerAddress: incoming.owner,
        puncturedAddress: bubble.owner,
        amount,
        timestamp,
        blockNumber: 0
    });

    //Calculate the damage
    const remaining = defense - attack;

    
    if(remaining >= 0){
        setBubbleResourceMass(bubble, ResourceType.ENERGY, remaining);
     }else {
        if(isSnapshot) {
            snapshotPendingInputs.push({
                executionTime: timestamp,
                timestamp,
                type: InputType.Puncture,
                bubbleId: bubble.body.getUserData() as string,
                resourceId: incoming.id,
                puncturePoint: {x: puncturePoint.x, y: puncturePoint.y},
                amount,
            })
            snapshotPendingInputs.sort((a, b) => a?.executionTime - b?.executionTime);
            //console.log(timestamp, " Adding puncture to snapshot:", snapshotPendingInputs)
        }else {
            pendingInputs.push({
                executionTime: timestamp,
                timestamp,
                type: InputType.Puncture,
                bubbleId: bubble.body.getUserData() as string,
                resourceId: incoming.id,
                puncturePoint: {x: puncturePoint.x, y: puncturePoint.y},
                amount,
            })
            pendingInputs.sort((a, b) => a?.executionTime - b?.executionTime);
            //console.log(timestamp, " Adding puncture to pendingInputs:", pendingInputs)
            
        } 
        setBubbleResourceMass(bubble, ResourceType.ENERGY, 0);
        
    }
    //Destroy the incoming resource
    updateResource(resources, incoming, 0, timestamp);  
    
    // if(remaining >= 0){
    //     //Transfer the remaining defense to the bubble and destroy the incoming resource
    //     setBubbleResourceMass(bubble, ResourceType.BLUE, remaining);
    // } else {
        
        
    //    //console.log("CREATING PUNCTURE AMOUNT: ", punctureAmount);
    //     addPuncturePoint(
    //         bubble, 
    //         {x: puncturePoint.x, y:puncturePoint.y}, 
    //         punctureAmount,
    //         timestamp
    //     );
    //     setBubbleResourceMass(bubble, ResourceType.BLUE, 0);
    // }

    // //Destroy the incoming resource
    // updateResource(resources, incoming, 0);   
}

export const handlePunctures = (
    timestamp: number,
    bubbles: Map<string, Bubble>,
    bubble: Bubble,
    timeElapsed: number,
    isSnapshot: boolean = false,
): void => {
    if (!bubble.punctures || bubble.punctures.size == 0) return;
    //console.log("bubble updated timestamp: ", timestamp, "isSnapshot: ", isSnapshot);

    bubble.punctures.forEach((puncture, puncturePoint) => {
        if(timestamp < puncture.start) return;
        if (!bubble.lastPunctureEmit) bubble.lastPunctureEmit = timestamp;

        const timeSinceLast = timestamp - bubble.lastPunctureEmit;

        if (timeSinceLast > 0.01) {
            const amountEmitted = Math.min(
                PLANCK_MASS*5,
                puncture.amount
            )

            if(amountEmitted < PLANCK_MASS){
               //console.log("Amount emitted is greater than puncture amount, omitting");
                puncture.amount = 0;
                return;
            }
            //Create puncture direction vector as random direction within 40 degrees of puncture vector
            const coneDegree = 5;
            const randomAngle = pseudoRandom(timestamp) *  coneDegree + (coneDegree/2)
            const puncturePointVec = Vec2(puncturePoint.x, puncturePoint.y);
            const emissionDirection = rotateVec2(puncturePointVec, randomAngle);
            emissionDirection.normalize();

            if (amountEmitted > 0) {
                const newPunctureAmount = puncture.amount - amountEmitted;
                const punctureEmittedBubble = emitBubble(
                    timestamp,
                    bubbles,
                    bubble,
                    amountEmitted,
                    puncturePointVec,
                    emissionDirection,
                    true,
                );
                puncture.amount = newPunctureAmount;
                if (newPunctureAmount <= 0)
                    bubble?.punctures?.delete(puncturePoint);
                bubble.lastPunctureEmit = timestamp;

                //console.log("Angle:(", randomAngle, ")  id: (", punctureEmittedBubble.body.getUserData() as string, ") at (", timestamp, ") isSnapshot: ", isSnapshot);

            }
        }
    });
};

export const handleBubbleUpdates = (
    timestamp: number,
    bubbles: Map<string, Bubble>,
    timeElapsed: number,
    isSnapshot: boolean = false,
): void => {
    bubbles.forEach((bubble) => {
        handlePunctures(timestamp, bubbles, bubble, timeElapsed, isSnapshot);
    });
};
