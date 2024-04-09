import { Room, Client } from "@colyseus/core";
import { MyRoomState } from "./schema/MyRoomState";
import { fetchAllUsers, fetchUsers } from "./privyApi";

import {
    BubbleStateSchema,
    EntityResourceStateSchema,
    ObstacleStateSchema,
    PortalStateSchema,
    ResourceNodeStateSchema,
    ResourceStateSchema,
    UserSchema,
    UserSocialSchema,
    Vector2Schema,
    WorldState,
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
import { Snapshot } from "../../../core/types/state";
import { ArraySchema } from "@colyseus/schema";
import { setOnEvent } from "../../../core/funcs/events";
import { EventsType } from "../../../core/types/events";
import { User } from "../../../core/types/user";

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
    snapshot.obstacles.forEach((obstacle) => {
        const newObstacle = new ObstacleStateSchema();
        newObstacle.id = obstacle.id;
        newObstacle.positionX = obstacle.position.x;
        newObstacle.positionY = obstacle.position.y;
        newObstacle.velocityX = obstacle.velocity.x;
        newObstacle.velocityY = obstacle.velocity.y;
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

    async onCreate(options: any) {
        //this.unwatchBlock();
        //this.unwatchInputs();

        //if(this.recievedStartupInspect) return;
        console.log("World room created!", options);
        this.setState(new WorldState());

        this.setSimulationInterval((deltaTime) => this.update(deltaTime));

        onInspect((snapshot) => {
            console.log("recieved snapshot", snapshot);
            updateState(this.state, snapshot);
            init(snapshot);
            snapshotInit(snapshot);
            this.recievedStartupInspect = true;
        });

        onUser((users) => {
            this.state.userSocials = new ArraySchema<UserSocialSchema>();
            users.forEach((user) => {
                this.state.userSocials.push(user);
            });
        });

        this.unwatchBlock = onBlock((blockTimestamp) => {
            console.log("recieved block", blockTimestamp);
            //if (!this.recievedStartupInspect) return;
            this.blockTimestamp = blockTimestamp;
            snapshotRun(this.blockTimestamp);
            rollbackToState(snapshotCurrentState);
            //max keep 10 snapshots
            if (snapshots.size > 15) {
                const oldestSnapshot = snapshots.keys().next().value;
                snapshots.delete(oldestSnapshot);
            }
        });

        this.unwatchInputs = onInput((input) => {
            setOnEvent((event: Event | any) => {
                //only if event.id does not exist within bubbleIds
                if (event.type == EventsType.CreateBubble) {
                    //if (!bubbleIds.includes(event.id)) {
                    //console.log("new event 11", event)
                    const pos = new Vector2Schema();
                    pos.x = event.position.x;
                    pos.y = event.position.y;
                    this.state.syncBubbleStartPositions.set(event.id, pos);
                    setOnEvent(() => {});
                    //}
                } else if (event.type == EventsType.DestroyBubble) {
                    //if (bubbleIds.includes(event.id)) {
                    //console.log("new event 22", event)
                    //bubbleDestroyPositions[event.id] =
                    event.position;
                    setOnEvent(() => {});
                    //}
                } else if (event.type == EventsType.CreateResource) {
                    //if (!resourceIds.includes(event.id)) {
                    //console.log("new event 33", event)
                    const pos = new Vector2Schema();
                    pos.x = event.position.x;
                    pos.y = event.position.y;
                    this.state.syncResourceStartPositions.set(event.id, pos);
                    event.position;
                    setOnEvent(() => {});
                    //}
                }
            });

            console.log("recieved input", input);
            //if (!this.recievedStartupInspect) return;
            const isBehind = input.timestamp < this.blockTimestamp;
            if (isBehind) {
                snapshotRollback(input.timestamp);
                const stateOfInput = snapshots.get(input.timestamp);
                rollbackToState(stateOfInput as Snapshot);
            }
            handleInput(input, true);

            if (isBehind) snapshotRun(this.blockTimestamp, () => {}, true);
        });

        // this.onMessage("type", (client, message) => {
        //   //
        //   // handle "type" message
        //   //
        // });
    }

    onJoin(client: Client, options: any) {
        console.log(client.sessionId, "joined!");
    }

    onLeave(client: Client, consented: boolean) {
        console.log(client.sessionId, "left!");
    }

    onDispose() {
        console.log("is disposing");
        this.unwatchBlock();
        this.unwatchInputs();
        this.recievedStartupInspect = false;
        this.setSimulationInterval(null);
        init();
        snapshotInit();
    }

    update(time: number) {
        //
        // handle game loop
        //
        //console.log("update", time);
        const now = Date.now() / 1000;
        run(now);
        updateState(this.state, currentState);
    }
}
