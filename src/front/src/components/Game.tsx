import { useFrame } from "@react-three/fiber";
import { BubbleState, PortalState, Snapshot } from "../../../core/types/state";
import { Portals } from "./Portals";
import { Bubbles } from "./Bubbles";
import { useEffect, useState } from "react";
import { currentState, init, nodes, rollbackToState, run } from "../../../core/world";
import { handleInput } from "../../../core/funcs/inputs";
import { Input } from "../../../core/types/inputs";
import { useBlockTimestamp } from "../hooks/state";
import {
    snapshotCurrentState,
    snapshotInit,
    snapshotRollback,
    snapshotRun,
    snapshots,
} from "../../../core/snapshots";
import { setInterpolation } from "../store/interpolation";
import { useDispatch } from "react-redux";
import { Nodes } from "./Nodes";
import { Resources } from "./Resources";
import { clearEvents, setOnEvent } from "../../../core/funcs/events";
import { EventsType } from "../../../core/types/events";
import { Client } from "colyseus.js";
import { INDEXER_URL } from "../consts";
import { current } from "@reduxjs/toolkit";
import { User } from "../../../core/types/user";
import { Puncture, PuncturePoint } from "../../../core/types/bubble";
import { ResourceType } from "../../../core/types/resource";
import { userSocialsState } from "@/hooks/socials";

const client = new Client(INDEXER_URL);
let room = await client.joinOrCreate("world");
const reconnectionToken = room.reconnectionToken;


const schemaToSnapshot = () => {

}

export const bubbleStartPositions: { [key: string]: { x: number; y: number } } =
    {};
export const bubbleDestroyPositions: {
    [key: string]: { x: number; y: number };
} = {};
export const resourceStartPositions: {
    [key: string]: { x: number; y: number };
} = {};
export const resourceDestroyPositions: {
    [key: string]: { x: number; y: number };
} = {};

//Create init function for state.onChange
const initStateServer = (room) => {
    room.state.onChange(() => {
        const { timestamp, users, bubbles, portals, nodes, resources, syncBubbleStartPositions, userSocials } = room.state;

        //Timestamp
        currentState.timestamp = timestamp

        //UserSocials
        userSocials.forEach((userSocial) => {
            const address = userSocial.address;
            userSocialsState[address] = userSocial;
        });

        console.log(userSocialsState);

        //Bubble start positions for interpolation
        syncBubbleStartPositions.forEach((value, key) => {
            bubbleStartPositions[key] = {
                x: value.x,
                y: value.y
            }
        })

        //Users
        currentState.users.length = 0;
        users.forEach((user) => {
            const tempUser: User = {
                address: user.address,
                balance: user.balance
            }
            currentState.users.push(tempUser)
        })

        //Bubbles
        currentState.bubbles.length = 0;
        users.forEach((user) => {
            const tempUser: User = {
                address: user.address,
                balance: user.balance
            }
            currentState.users.push(tempUser)
        })

        bubbles.forEach((bubble) => {
            const resources: {
                resource: ResourceType;
                mass: number;
            }[] = []
            bubble.resources.forEach((value)=>{
                resources.push({
                    resource: value.resource,
                    mass: value.mass
                })
            })
            const punctures: {
                point: PuncturePoint;
                puncture: Puncture;
            }[] = []
            bubble.punctures.forEach((value)=>{

            })
            const tempBubble: BubbleState = {
                id: bubble.id,
                owner: bubble.owner,
                position: {
                    x: bubble.positionX,
                    y: bubble.positionY,
                },
                velocity: {
                    x: bubble.velocityX,
                    y: bubble.velocityY,
                },
                mass: bubble.mass,
                resources,
                punctures,
                lastPunctureEmit: bubble.lastPunctureEmit,
                from: bubble.from,
            }
            currentState.bubbles.push(tempBubble)

        })

        //Portals
        currentState.portals.length = 0;
        portals.forEach((portal) => {
            const resources: {
                resource: ResourceType;
                mass: number;
            }[] = []
            portal.resources.forEach((value)=>{
                resources.push({
                    resource: value.resource,
                    mass: value.mass
                })
            })
            const tempPortal: PortalState = {
                id: portal.id,
                owner: portal.owner,
                position: {
                    x: portal.positionX,
                    y: portal.positionY,
                },
                mass: portal.mass,
                resources,
            }
            currentState.portals.push(tempPortal)

        })

        //Nodes
        currentState.nodes.length = 0;
        nodes.forEach((node) => {
            const tempNode = {
                id: node.id,
                type: node.type,
                position: {
                    x: node.positionX,
                    y: node.positionY,
                },
                mass: node.mass,
                emissionDirection: {
                    x: node.emissionDirectionX,
                    y: node.emissionDirectionY,
                },
                lastEmission: node.lastEmission,
            }
            currentState.nodes.push(tempNode)
        })

        //Resources
        currentState.resources.length = 0;
        resources.forEach((resource) => {
            const tempResource = {
                id: resource.id,
                type: resource.type,
                position: {
                    x: resource.positionX,
                    y: resource.positionY,
                },
                mass: resource.mass,
                owner: resource.owner,
                velocity: {
                    x: resource.velocityX,
                    y: resource.velocityY,
                },
            }
            currentState.resources.push(tempResource)
        })
    });

    room.connection.events.onclose = (e) => {
        console.log("connection closed", e)
    }
    room.connection.events.onopen = (e) => {
        console.log("connection opened", e)
    }

    room.connection.events.onerror = (e) => {
        console.log("connection error", e)
    }
}

//Every 5 seconds check the state of the room
initStateServer(room)
setInterval(() => {
    const isOpen = room.connection.isOpen
    console.log("room state", room.connection.isOpen)
    if(!isOpen){
        console.log("reconnecting")
        client.joinOrCreate("world")
            .then((newRoom) => {
                room = newRoom;
                initStateServer(room)
                console.log("reconnected")
            })
    }
}, 1000)


// room.state.listen("resources", (resources) => {
   
// })
// room.state.listen("nodes", (nodes) => {

// })


const SIMULATE_IN_CLIENT = false;

export const Game = () => {
    //console.log("22 inputs:", inputs)
    //console.log("22 notices:", notices)
    // Get current timestamps
    //const blockTimestamp = useBlockTimestamp();
    //const dispatch = useDispatch();

    //Initialize client state
    // const [lastTimestampHandled, setLastTimestampHandled] = useState<number>(
    //     snapshot.timestamp,
    // );
    //console.log("lastTimestampHandled:", lastTimestampHandled)
    //console.log("snapshot recieved", snapshot);
    //Game object ids
    const [bubbleIds, setBubbleIds] = useState<string[]>([]);
    const [portalIds, setPortalIds] = useState<string[]>([]);
    const [nodeIds, setNodeIds] = useState<string[]>([]);
    const [resourceIds, setResourceIds] = useState<string[]>([]);

    // //Initialize client state
    // useEffect(() => {
    //     if (!snapshot) return;
    //     init(snapshot);
    //     snapshotInit(snapshot);
    //     //console.log("init snapshot:", snapshot)
    //     setBubbleIds(snapshot.bubbles.map((bubble) => bubble.id));
    //     setPortalIds(snapshot.portals.map((portal) => portal.id));
    //     setNodeIds(snapshot.nodes.map((node) => node.id));
    //     setResourceIds(snapshot.resources.map((resource) => resource.id));
    //     //console.log("init world:", world)
    // }, [snapshot]);

    //Check for new inputs, make sure to only run on new inputs
    // useEffect(() => {
    //     if (inputs.length > 0) {
    //         [...inputs]
    //             .sort(
    //                 (a: Input | any, b: Input | any) =>
    //                     a.timestamp - b.timestamp,
    //             )
    //             .filter(
    //                 (input: any | Input) =>
    //                     input.timestamp > lastTimestampHandled,
    //             )
    //             .forEach((input: any | Input) => {
    //                 const isBehind = input.timestamp < blockTimestamp;
    //                 //console.log("new input11", input)
    //                 clearEvents();
    //                 if (isBehind) {
    //                     snapshotRollback(input.timestamp);
    //                     const stateOfInput = snapshots.get(input.timestamp);
    //                     rollbackToState(stateOfInput as Snapshot);
    //                 }
    //                 if (input?.prediction) {
    //                     //clear pending inputs
    //                     handleInput(input);
    //                     setBubbleIds(
    //                         currentState.bubbles.map((bubble) => bubble.id),
    //                     );
    //                     setPortalIds(
    //                         currentState.portals.map((portal) => portal.id),
    //                     );
    //                     setNodeIds(currentState.nodes.map((node) => node.id));
    //                     setResourceIds(
    //                         currentState.resources.map(
    //                             (resource) => resource.id,
    //                         ),
    //                     );
    //                 }
    //                 handleInput(input, true);

    //                 if (isBehind) snapshotRun(blockTimestamp, () => {}, true);
    //                 setLastTimestampHandled(input.timestamp);
    //                 setBubbleIds(
    //                     snapshotCurrentState.bubbles.map((bubble) => bubble.id),
    //                 );
    //                 setPortalIds(
    //                     snapshotCurrentState.portals.map((portal) => portal.id),
    //                 );
    //                 setNodeIds(
    //                     snapshotCurrentState.nodes.map((node) => node.id),
    //                 );
    //                 setResourceIds(
    //                     snapshotCurrentState.resources.map(
    //                         (resource) => resource.id,
    //                     ),
    //                 );

    //                 dispatch(setInterpolation(input.timestamp));

    //                 setOnEvent((event: Event | any) => {
    //                     //only if event.id does not exist within bubbleIds
    //                     if (event.type == EventsType.CreateBubble) {
    //                         if (!bubbleIds.includes(event.id)) {
    //                             //console.log("new event 11", event)
    //                             bubbleStartPositions[event.id] = event.position;
    //                             setOnEvent(() => {});
    //                         }
    //                     } else if (event.type == EventsType.DestroyBubble) {
    //                         if (bubbleIds.includes(event.id)) {
    //                             //console.log("new event 22", event)
    //                             bubbleDestroyPositions[event.id] =
    //                                 event.position;
    //                             setOnEvent(() => {});
    //                         }
    //                     } else if (event.type == EventsType.CreateResource) {
    //                         if (!resourceIds.includes(event.id)) {
    //                             //console.log("new event 33", event)
    //                             resourceStartPositions[event.id] =
    //                                 event.position;
    //                             setOnEvent(() => {});
    //                         }
    //                     }
    //                 });
    //                 //Get events
    //                 const now = Date.now() / 1000;
    //                 run(now);
    //             });
    //     }
    // }, [inputs]);

    //Predict snapshots
    // useEffect(() => {
    //     //Run the world
    //     if (!snapshot) return;
    //     if (blockTimestamp <= lastTimestampHandled) return;
    //     //const maxTimeToRun = interpolation.from ? interpolation.from : blockTimestamp
    //     snapshotRun(blockTimestamp, () => {}, true);

    //     //Rollback and update client state
    //     // const end = Math.max(Date.now() / 1000, blockTimestamp)
    //     //console.log("setting snapshotCurrentState:", snapshotCurrentState)
    //     //console.log("setting currentState:", currentState)
    //     rollbackToState(snapshotCurrentState);
    //     // run(end)

    //     //Add new objects if they exist
    //     // setBubbleIds(snapshotCurrentState.bubbles.map(bubble => bubble.id))
    //     // setPortalIds(snapshotCurrentState.portals.map(portal => portal.id))

    //     //console.log(end)
    // }, [blockTimestamp]);

    //Predict client state
    useFrame(() => {
        //console.log("new delta", state.clock.getDelta())
        const now = Date.now() / 1000;
        // if(interpolation.from){
        //     const maxTimeToRun = Math.min(now, interpolation.from)
        //    //console.log("interpolating: ", maxTimeToRun, now)
        //     run(maxTimeToRun)
        //     dispatch(interpolate({step: 0.09, end: now}))
        // }else{
        //run(now);
        // }
        setBubbleIds(currentState.bubbles.map((bubble) => bubble.id));
        //console.log("123at", currentState.bubbles);
        //console.log("123at", currentState.bubbles.map(bubble => bubble.id))
        //console.log("bubbles", currentState.bubbles);
        setPortalIds(currentState.portals.map((portal) => portal.id));
        setNodeIds(currentState.nodes.map((node) => node.id));
        setResourceIds(currentState.resources.map((resource) => resource.id));
    });

    //console.log(inputs)
    return (
        <>
            <Portals portals={portalIds ?? []} />
            <Bubbles bubbles={bubbleIds ?? []} />
            <Nodes nodes={nodeIds ?? []} />
            <Resources resources={resourceIds ?? []} />
        </>
    );
};
