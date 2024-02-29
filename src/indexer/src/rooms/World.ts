import { Room, Client } from "@colyseus/core";
import { MyRoomState } from "./schema/MyRoomState";
import { BubbleStateSchema, EntityResourceStateSchema, PortalStateSchema, WorldState } from "./schema/WorldState";
import { currentState, init, rollbackToState, run } from "../../../core/world";
import { snapshotRollback, snapshotRun, snapshots, snapshotInit, snapshotCurrentState } from "../../../core/snapshots";
import { onBlock, onInput, onInspect } from "./indexer";
import { handleInput } from "../../../core/funcs/inputs";
import { Snapshot } from "../../../core/types/state";
import { ArraySchema } from "@colyseus/schema";

const updateState = (state: WorldState, snapshot: Snapshot): WorldState => {
  state.timestamp = snapshot.timestamp;
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
    bubble.resources.forEach((resource) => {
      const newEntityResource = new EntityResourceStateSchema();
      newEntityResource.mass = resource.mass;
      newBubble.resources.push(newEntityResource);
    });
    state.bubbles.push(newBubble);
    
  });
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
  return state;
  

}

export class World extends Room<WorldState> {
  maxClients = 1000;
  blockTimestamp: number = 0;
  recievedStartupInspect = false;

  onCreate (options: any) {
    this.setState(new WorldState());

    this.setSimulationInterval((deltaTime) => this.update(deltaTime));

    onInspect((snapshot) => {
      //console.log("recieved snapshot", snapshot);
      updateState(this.state, snapshot);
      init(snapshot);
      snapshotInit(snapshot);
      this.recievedStartupInspect = true;
    });


    onBlock((blockTimestamp) => {
      if (!this.recievedStartupInspect) return;
      this.blockTimestamp = blockTimestamp
      snapshotRun(this.blockTimestamp);
      rollbackToState(snapshotCurrentState);
      //max keep 10 snapshots
      if (snapshots.size > 15) {
        const oldestSnapshot = snapshots.keys().next().value;
        snapshots.delete(oldestSnapshot);
      }
    });

    onInput((input) => {
      if (!this.recievedStartupInspect) return;
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

  onJoin (client: Client, options: any) {
    console.log(client.sessionId, "joined!");
  }

  onLeave (client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }

  update (time: number) {
    //
    // handle game loop
    //
    const now = Date.now() / 1000;
    run(now)
    updateState(this.state, currentState);
  }


}
