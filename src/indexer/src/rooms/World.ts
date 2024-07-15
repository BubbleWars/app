import { Room, Client } from "@colyseus/core";
import { MyRoomState } from "./schema/MyRoomState";
import { fetchAllUsers, fetchUsers } from "./privyApi";

import {
    BubbleStateSchema,
    EntityResourceStateSchema,
    EventSchema,
    ObstacleStateSchema,
    PortalStateSchema,
    ResourceNodeStateSchema,
    ResourceStateSchema,
    UserSchema,
    UserSocialSchema,
    Vector2Schema,
    WorldState,
    eventToSchema,
} from "./schema/WorldState";
import { currentState, init, rollbackToState, run } from "../../../core/world";
import {
    snapshotRollback,
    snapshotRun,
    snapshots,
    snapshotInit,
    snapshotCurrentState,
} from "../../../core/snapshots";
import { onBlock, onInput, onInspect, onUser } from "./indexer";
import { handleInput } from "../../../core/funcs/inputs";
import { CircleState, PolygonState, Snapshot } from "../../../core/types/state";
import { ArraySchema } from "@colyseus/schema";
import { setOnEvent } from "../../../core/funcs/events";
import { EventsType } from "../../../core/types/events";
import { User } from "../../../core/types/user";
import { snapshot } from "viem/_types/actions/test/snapshot";
import { preciseRound } from "../../../core/funcs/utils";

let timeOffset = 0;
const getNow = () => {
    return preciseRound((Date.now() / 1000) + timeOffset, 2);

}

const updateState = (state: WorldState, snapshot: Snapshot): WorldState => {
    state.timestamp = snapshot.timestamp;
    //set users
    state.users.clear();
    snapshot.users.forEach((user) => {
        const newUser = new UserSchema();
        newUser.address = user.address;
        newUser.balance = user.balance;
        state.users.push(newUser);
    });

    //set bubbles
    state.bubbles.clear();
    snapshot.bubbles.forEach((bubble) => {
        const newBubble = new BubbleStateSchema();
        newBubble.id = bubble.id;
        newBubble.owner = bubble.owner;
        newBubble.positionX = bubble.position.x;
        newBubble.positionY = bubble.position.y;
        newBubble.velocityX = bubble.velocity.x;
        newBubble.velocityY = bubble.velocity.y;
        newBubble.mass = bubble.mass;
        newBubble.resources = new ArraySchema<EntityResourceStateSchema>();
        newBubble.from = bubble.from ?? "";
        bubble.resources.forEach((resource) => {
            const newEntityResource = new EntityResourceStateSchema();
            newEntityResource.mass = resource.mass;
            newEntityResource.resource = resource.resource;
            newBubble.resources.push(newEntityResource);
        });
        state.bubbles.push(newBubble);
    });

    //set portals
    state.portals.clear();
    snapshot.portals.forEach((portal) => {
        const newPortal = new PortalStateSchema();
        newPortal.id = portal.id;
        newPortal.owner = portal.owner;
        newPortal.positionX = portal.position.x;
        newPortal.positionY = portal.position.y;
        newPortal.mass = portal.mass;
        newPortal.resources = new ArraySchema<EntityResourceStateSchema>();
        portal.resources.forEach((resource) => {
            const newEntityResource = new EntityResourceStateSchema();
            newEntityResource.mass = resource.mass;
            newPortal.resources.push(newEntityResource);
        });
        state.portals.push(newPortal);
    });

    //Set obstacles
    state.obstacles.clear();
    snapshot.obstacles.obstaclesStates.forEach((obstacle) => {
        const newObstacle = new ObstacleStateSchema();
        newObstacle.id = obstacle.id;
        newObstacle.positionX = obstacle.position.x;
        newObstacle.positionY = obstacle.position.y;
        newObstacle.type = obstacle.shape.type;
        newObstacle.angle = obstacle.angle;
        newObstacle.radius = (obstacle.shape as CircleState)?.radius ?? 0;
        newObstacle.vertices = new ArraySchema<Vector2Schema>();
        ((obstacle.shape as PolygonState)?.vertices ?? []).forEach((vertex) => {
            const newVertex = new Vector2Schema();
            newVertex.x = vertex.x;
            newVertex.y = vertex.y;
            newObstacle.vertices.push(newVertex);
        });

        state.obstacles.push(newObstacle);
    });

    //set nodes
    state.nodes.clear();
    snapshot.nodes.forEach((node) => {
        const newNode = new ResourceNodeStateSchema();
        newNode.id = node.id;
        newNode.positionX = node.position.x;
        newNode.positionY = node.position.y;
        newNode.mass = node.mass;
        newNode.type = node.type;
        newNode.emissionDirectionX = node.emissionDirection.x;
        newNode.emissionDirectionY = node.emissionDirection.y;
        newNode.lastEmission = node.lastEmission;
        newNode.k = node.k;
        newNode.currentSupply = node.currentSupply;
        newNode.marketCap = node.marketCap;
        state.nodes.push(newNode);
    });

    //set resources
    state.resources.clear();
    snapshot.resources.forEach((resource) => {
        const newResource = new ResourceStateSchema();
        newResource.id = resource.id;
        newResource.owner = resource.owner;
        newResource.positionX = resource.position.x;
        newResource.positionY = resource.position.y;
        newResource.velocityX = resource.velocity.x;
        newResource.velocityY = resource.velocity.y;
        newResource.mass = resource.mass;
        newResource.type = resource.type;
        state.resources.push(newResource);
    });

    //set protocol
    // state.protocol.balance = snapshot.protocol.balance;
    // state.protocol.pendingEthBalance = snapshot.protocol.pendingEthBalance;
    // state.protocol.pendingEnergyBalance = snapshot.protocol.pendingEnergyBalance;
    // state.protocol.pendingEnergySpawn = snapshot.protocol.pendingEnergySpawn;
    // state.protocol.rentCost = snapshot.protocol.rentCost;
    // state.protocol.rentDueAt = snapshot.protocol.rentDueAt;
    // state.protocol.hasPayedRent = new ArraySchema<string>();
    // if(snapshot.protocol.hasPayedRent) snapshot.protocol.hasPayedRent.forEach((val)=>{
    //     state.protocol.hasPayedRent.push(val)
    // })
 

    return state;
};

const started = false;

export class World extends Room<WorldState> {
    maxClients = 1000;
    blockTimestamp: number = 0;
    recievedStartupInspect = false;
    unwatchInputs: () => void = () => {};
    unwatchBlock: () => void = () => {};
    autoDispose = false;
    started = false;

    async onCreate(options: any) {
        //this.unwatchBlock();
        //this.unwatchInputs();

        //if(this.recievedStartupInspect) return;
       //console.log("World room created!", options);
        this.setState(new WorldState());


        onInspect((snapshot) => {
           //console.log("recieved snapshot", snapshot);
            updateState(this.state, snapshot);
            init(snapshot);
            snapshotInit(snapshot);
            if(snapshot.timestamp >= 0){
                this.recievedStartupInspect = true;
                this.started = true;
                this.setSimulationInterval((deltaTime) => this.update(deltaTime));
                this.started = true;
                this.unwatchBlock = onBlock((blockTimestamp) => {
                    //console.log("recieved block", blockTimestamp);
                    //if (!this.recievedStartupInspect) return;
                    this.blockTimestamp = blockTimestamp;
                    snapshotRun(this.blockTimestamp);
                    //console.log("block timestamp", this.blockTimestamp, "current snapshot state", snapshotCurrentState.timestamp, "current timestamp", snapshotCurrentState)
                    
                    //rollbackToState(snapshotCurrentState);
                    //max keep 10 snapshots
                    if (snapshots.size > 15) {
                        const oldestSnapshot = snapshots.keys().next().value;
                        snapshots.delete(oldestSnapshot);
                    }
                });
            }
        });

        onUser((users) => {
            this.state.userSocials = new ArraySchema<UserSocialSchema>();
            users.forEach((user) => {
                this.state.userSocials.push(user);
            });
        });

        

        this.unwatchInputs = onInput((input) => {
          //console.log("current timestamp", this.state.timestamp)
          //console.log("Recieved input World.ts", input);
          const startTime = Date.now();

            

        


            //If current block is ahead of input, rollback and append input
            const isBlockAhead = input.timestamp <= this.blockTimestamp;
            const isBlockBehind = input.timestamp > this.blockTimestamp;
            if (isBlockAhead) {
              //console.log("Local Block is ahead. Input timestamp:", input.timestamp, "Block timestamp:", this.blockTimestamp)
              snapshotRollback(input.timestamp);
              handleInput(input, true);
              snapshotRun(this.blockTimestamp);

            } else if (isBlockBehind) {
             //console.log("Local Block is behind. Input timestamp:", input.timestamp, "Block timestamp:", this.blockTimestamp)
              handleInput(input, true);
              snapshotRun(input.timestamp, () => {}, true);
            }

            //If the server's timestamp is ahead,  rollback to input timestamp, and add input
            const serverTimestamp = this.state.timestamp;
            const isServerAhead = input.timestamp < serverTimestamp;
            const mainSnapshots = snapshots;
            const mainCurrentState = currentState;
            setOnEvent((event) => {
                    console.log("broadcasting event", EventsType[event.type], event);
                    this.broadcast("event", event, { afterNextPatch: true });
                });
            if(isServerAhead){
              //console.log("Server is ahead. Input timestamp:", input.timestamp, "Server timestamp:", this.state.timestamp)
              const stateOfInput = snapshots.get(input.timestamp);
              //console.log("pending inputs of snapshot state", JSON.stringify(stateOfInput?.pendingInputs), "to be set to server")
              rollbackToState(stateOfInput as Snapshot);
            }else {
                
                handleInput(input);
            }
            //console.log("snapshot bubbles", snapshotCurrentState.bubbles)
            //console.log("current bubbles", currentState.bubbles)
            //handleInput(input);
            // run(serverTimestamp, () => {
            //    //console.log("microstep", currentState.timestamp, "current timestamp", this.state.timestamp)
            //     updateState(this.state, currentState);
            // });
            // const endTime = getNow();
            // let processTime = input.timestamp;
            ////console.log("input timestamp", input.timestamp, "end time", endTime)
            // while(processTime < endTime){
            //    //console.log("microstep", processTime, "current timestamp", this.state.timestamp)
            //     updateState(this.state, currentState);
            //     processTime += 1/60;
            //     run(processTime);
            // }

            //console.log("timestamp of world", currentState.timestamp);
            if (!started && this.recievedStartupInspect) {
                this.setSimulationInterval((deltaTime) => this.update(deltaTime));
                this.started = true;
                this.unwatchBlock = onBlock((blockTimestamp) => {
                    //console.log("recieved block", blockTimestamp);
                    //if (!this.recievedStartupInspect) return;
                    this.blockTimestamp = blockTimestamp;
                    snapshotRun(this.blockTimestamp);
                    //console.log("block timestamp", this.blockTimestamp, "current snapshot state", snapshotCurrentState.timestamp, "current timestamp", snapshotCurrentState)
                    
                    //rollbackToState(snapshotCurrentState);
                    //max keep 10 snapshots
                    if (snapshots.size > 15) {
                        const oldestSnapshot = snapshots.keys().next().value;
                        snapshots.delete(oldestSnapshot);
                    }
                });
            }
        });

        // this.onMessage("type", (client, message) => {
        //   //
        //   // handle "type" message
        //   //
        // });
    }

    onJoin(client: Client, options: any) {
       //console.log(client.sessionId, "joined!");
    }

    onLeave(client: Client, consented: boolean) {
       //console.log(client.sessionId, "left!");
    }

    onDispose() {
       //console.log("is disposing");
        this.unwatchBlock();
        this.unwatchInputs();
        this.recievedStartupInspect = false;
        this.setSimulationInterval(null);
        init();
        snapshotInit();
    }

    update(time: number) {
        setOnEvent((event) => {
            console.log("broadcasting event", EventsType[event.type], event);
            this.broadcast("event", event, {afterNextPatch: true})
        });
        //
        // handle game loop
        //
        if(getNow() < this.state.timestamp) {
           //console.log("timestamp jumping", getNow(), this.state.timestamp)
            timeOffset = this.state.timestamp - getNow();
        }
        run(getNow());
        updateState(this.state, currentState);

    }
}
