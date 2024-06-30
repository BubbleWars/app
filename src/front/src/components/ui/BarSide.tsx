import { useEffect, useState } from "react";
import SlidingPanel from "react-sliding-side-panel";
import {
    ChevronRightIcon,
    ChevronLeftIcon,
    Crosshair1Icon,
    CircleIcon,
    DotFilledIcon,
    Cross1Icon,
    ShadowIcon,
} from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";

import { Drawer } from "vaul";

//   import {
//     Drawer,
//     DrawerClose,
//     DrawerContent,
//     DrawerDescription,
//     DrawerFooter,
//     DrawerHeader,
//     DrawerPortal,
//     DrawerTitle,
//     DrawerTrigger,
//   } from "@/components/ui/drawer"

import { useWallets } from "@privy-io/react-auth";
import { BubbleState } from "../../../../core/types/state";
import { ResourceType } from "../../../../core/types/resource";
import { currentState } from "../../../../core/world";
import { truncateAddress } from "../../../../core/funcs/utils";
import { User } from "../../../../core/types/user";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { Separator } from "./separator";
import { ChevronDown } from "lucide-react";
import { getPortalResourceMass, getPortalStateResourceMass } from "../../../../core/funcs/portal";
import { Title } from "@radix-ui/react-dialog";
import { UserView } from "./UserView";
import { getBubbleStateResourceMass } from "../../../../core/funcs/bubble";
import { useInterval, useMachineTimestamp } from "@/hooks/state";

export const RESOURCE_TO_COLOR = {
    [ResourceType.Energy]: "#0000FF",
};

export const AddressView = ({ id }: { id: string }) => {
    return (
        <p className="text-xs bold color-blue">{truncateAddress(id)}</p>
    )
}

export const MassView = ({ mass }: { mass: number }) => {
    return <p className="text-xs bold blue">{mass.toFixed(2)} ETH</p>
}

export const CameraLock = ({ id }: { id: string }) => {};

export const ResourcesIcon = ({
    resources,
}: {
    resources: { resource: ResourceType; mass: number }[];
}) => {
    const defaultResources = [{}];
    const blue = resources.find((resource) => resource.resource === ResourceType.Energy);
    return (
        <div className="flex items-center space-x-2">
            {/* {resources.map((resource) => (
                <div
                    key={resource.resource}
                    className="flex items-center space-x-2"
                    style={{ color: RESOURCE_TO_COLOR[resource.resource] }}
                >
                    <p>{resource.mass}</p>
                    <CircleIcon
                        className="h-4 w-4"
                        style={{ fill: RESOURCE_TO_COLOR[resource.resource] }}
                    />
                </div>
            ))} */}
                <div 
                    key="blue" 
                    className="flex items-center color-blue space-x-0"
                >
                    <p className="text-xs text-blue-500">{blue?.mass?.toFixed(2) ?? 0}</p>
                    <Cross1Icon color="blue-500" className="item-center p-0 m-0 fill-blue-500 stroke-fill-blue-500 h-2 w-2" />
                    <ShadowIcon  color="blue-500" className="item-center h-2 w-2 p-0 m-0 fill-blue-500 stroke-fill-blue-500" />
                </div>
                <div
                    key="red"
                    className="flex items-center color-red space-x-0"
                >
                    <p className="text-xs text-red-500">0.00</p>
                    <Cross1Icon color="red-500" className="item-center p-0 m-0 fill-red-500 stroke-fill-red-500 h-2 w-2" />
                    <ShadowIcon  color="red-500" className="item-center h-2 w-2 p-0 m-0 fill-red-500 stroke-fill-red-500" />
                </div>
                <div
                    key="green"
                    className="flex items-center color-green space-x-0"
                >
                    <p className="text-xs text-green-500">0.00</p>
                    <Cross1Icon color="green-500" className="item-center p-0 m-0 fill-green-500 stroke-fill-green-500 h-2 w-2" />
                    <ShadowIcon  color="green-500" className="itemr-center h-2 w-2 p-0 m-0 fill-green-500 stroke-fill-green-500" />
                </div>

        </div>
    );
};

export const PositionIcon = ({
    position,
}: {
    position: { x: number; y: number };
}) => {
    return (
        <div className="flex items-center space-x-1">
            <Crosshair1Icon className="h-4 w-4" />
            <div className="flex flex-row items-center">
                <p className="text-xs text-gray-500">{position.x.toFixed(2)},</p>
                <p className="text-xs text-gray-500">{position.y.toFixed(2)}</p>
            </div>
        </div>
    );
};

export const VelocityIcon = ({
    velocity,
}: {
    velocity: { x: number; y: number };
}) => {
    const magnitude = Math.sqrt(velocity.x ** 2 + velocity.y ** 2).toFixed(2);
    const angle = Math.atan2(velocity.y, velocity.x) * (180 / Math.PI);

    // SVG properties for positioning
    const svgSize = 50; // Size of the container SVG to position the arrow SVG within it
    const arrowSize = 15; // The size of the arrow SVG
    const centerX = svgSize / 2 - arrowSize / 2; // Centering the arrow SVG in the container
    const centerY = svgSize / 2 - arrowSize / 2;

    return (
        <div className="flex items-center">
            <svg width={svgSize} height={svgSize}>
                <g
                    transform={`translate(${centerX}, ${centerY}) rotate(${angle}, ${arrowSize / 2}, ${arrowSize / 2})`}
                >
                    <path
                        d="M8.14645 3.14645C8.34171 2.95118 8.65829 2.95118 8.85355 3.14645L12.8536 7.14645C13.0488 7.34171 13.0488 7.65829 12.8536 7.85355L8.85355 11.8536C8.65829 12.0488 8.34171 12.0488 8.14645 11.8536C7.95118 11.6583 7.95118 11.3417 8.14645 11.1464L11.2929 8H2.5C2.22386 8 2 7.77614 2 7.5C2 7.22386 2.22386 7 2.5 7H11.2929L8.14645 3.85355C7.95118 3.65829 7.95118 3.34171 8.14645 3.14645Z"
                        fill="currentColor"
                    />
                </g>
            </svg>
            <p>{magnitude} m/s</p>
        </div>
    );
};

// export const LeaderboardPlayer = ({player, rank}: {player: User}) => {
//     const portal = currentState.portals.find((portal) => portal.owner === player.address);
//     const bubbles = currentState.bubbles.filter((bubble) => bubble.owner === player.address);
//     const portalResourceMass = getPortalStateResourceMass(portal, ResourceType.ENERGY);
//     const bubblesResourceMass = bubbles.reduce((acc, bubble) => acc + bubble.resources.find(resource => resource.resource === ResourceType.ENERGY)?.mass ?? 0, 0);
//     const totalResourceMass = portalResourceMass + bubblesResourceMass;



//     return (
//         <div className="flex items-center space-x-2">
//             <p>
//         </div>
//     );

// }  

export const ListPlayersLeaderboard = ({ players }: { players: User[] }) => {
    const [fullPlayers, setFullPlayers] = useState<{ address: string; resourcesCollected: number }[]>(
        players.map((player) => {
            const portal = currentState.portals.find((portal) => portal.owner === player.address);
            const bubbles = currentState.bubbles.filter((bubble) => bubble.owner === player.address);
            const portalResourceMass = getPortalStateResourceMass(portal, ResourceType.ENERGY);
            const bubblesResourceMass = bubbles.reduce((acc, bubble) => acc + getBubbleStateResourceMass(bubble, ResourceType.ENERGY) ?? 0, 0);
            const totalResourceMass = portalResourceMass + bubblesResourceMass;
            return {
                address: player.address,
                resourcesCollected: totalResourceMass,
            };
        }).sort((a, b) => b.resourcesCollected - a.resourcesCollected)
    );
    
    
   
    useInterval(() => {
        setFullPlayers(
            players.map((player) => {
                const portal = currentState.portals.find((portal) => portal.owner === player.address);
                const bubbles = currentState.bubbles.filter((bubble) => bubble.owner === player.address);
                const portalResourceMass = getPortalStateResourceMass(portal, ResourceType.ENERGY);
                const bubblesResourceMass = bubbles.reduce((acc, bubble) => acc + getBubbleStateResourceMass(bubble, ResourceType.ENERGY) ?? 0, 0);
                const totalResourceMass = portalResourceMass + bubblesResourceMass;
                return {
                    address: player.address,
                    resourcesCollected: totalResourceMass,
                };
            }).sort((a, b) => b.resourcesCollected - a.resourcesCollected)
        );
    }, 1000);

    return (
<div className="rounded-md border fixed right-0 top-0 w-97 h-96 p-4" style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}>
            <h1 className="font-bold text-lg">Leaderboard</h1>
            <ScrollArea className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Rank</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Tokens Owned</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {fullPlayers.map((player, index) => (
                            <TableRow>
                                <TableCell>#{index + 1}</TableCell>
                                <TableCell><UserView address={player.address}/></TableCell>
                                <TableCell><div className="text-sm text-bold text-blue-400">{player.resourcesCollected.toFixed(2)} $BBL</div></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </ScrollArea>
        </div>
    );
};


export const ListPlayers = ({ players }: { players: User[] }) => {
    const fullPlayers: {
        address: string;
        position: { x: number; y: number };
        mass: number;
        resources: { resource: ResourceType; mass: number }[];
        bubbles: BubbleState[];
    }[] = players.map((player) => {
        const portal = currentState.portals.find(
            (portal) => portal.owner === player.address,
        );
        const portalResources = portal ? portal.resources : [];
        const bubbles = currentState.bubbles.filter(
            (bubble) => bubble.owner === player.address,
        );
        return {
            address: player.address,
            position: portal ? portal.position : { x: 0, y: 0 },
            mass: portal ? portal.mass : 0,
            resources: portalResources,
            bubbles: bubbles,
        };
    });

    return (
        <ScrollArea className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Mass</TableHead>
                        <TableHead>Resources</TableHead>
                        <TableHead>Bubbles</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {fullPlayers.map((player) => (
                        <Collapsible key={player.address} asChild>
                            <>
                                <TableRow>
                                    <TableCell>{truncateAddress(player.address)}</TableCell>
                                    <TableCell><PositionIcon position={player.position} /></TableCell>
                                    <TableCell><MassView mass={player.mass} /></TableCell>
                                    <TableCell><ResourcesIcon resources={player.resources} /></TableCell>
                                    <TableCell>
                                        <CollapsibleTrigger asChild>
                                            <ChevronDown className="h-4 w-4" />
                                        </CollapsibleTrigger>
                                    </TableCell>
                                </TableRow>
                                <CollapsibleContent asChild>
                                    <ListBubbles bubbles={player.bubbles} />
                                </CollapsibleContent>
                            </>
                        </Collapsible>
                    ))}
                </TableBody>
            </Table>
        </ScrollArea>
    );
};

export const ListBubbles = ({ bubbles }: { bubbles: BubbleState[] }) => {
    return (
        <ScrollArea className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Velocity</TableHead>
                        <TableHead>Mass</TableHead>
                        <TableHead>Resources</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {bubbles.map((bubble) => (
                        <TableRow>
                            <TableCell>
                                <AddressView id={bubble.id} />
                            </TableCell>
                            <TableCell>
                                <PositionIcon position={bubble.position} />
                            </TableCell>
                            <TableCell>
                                <VelocityIcon velocity={bubble.velocity} />
                            </TableCell>
                            <TableCell>
                                <MassView mass={bubble.mass} />
                            </TableCell>
                            <ResourcesIcon resources={bubble.resources} />
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </ScrollArea>
    );
};

{
    /* <TableCell><PositionIcon position={bubble.position} /></TableCell>
<TableCell><VelocityIcon velocity={bubble.velocity} /></TableCell>
<TableCell>{bubble.mass} ETH</TableCell>
<TableCell><ResourcesIcon resources={bubble.resources} /></TableCell> */
}

export const TabYours = () => {
    const { wallets } = useWallets();

    const connectedAddress = wallets[0]?.address ? `${wallets[0].address}` : "";
    const address = connectedAddress;

    const portal = currentState.portals.find(
        (portal) => portal.id.toLowerCase() == address.toLowerCase(),
    );
    const portalResources = portal ? portal.resources : [];
    const yourBubbles = currentState.bubbles.filter(
        (bubble) => bubble.owner.toLowerCase() == address.toLowerCase(),
    );
    const truncatedAddress = portal?.owner
        ? truncateAddress(portal.owner)
        : "No portal";
    const portalMass = portal?.mass ?? 0;
    const portalPosition = portal?.position ?? { x: 0, y: 0 };
   //console.log(portal);

    useEffect(() => {

    }, [address])

    return (
        <Accordion
            type="multiple"
            className="w-full"
            defaultValue={["portal", "bubbles", "liquidity"]}
        >
            <AccordionItem value="portal">
                <AccordionTrigger className="font-semibold">Portal</AccordionTrigger>
                <AccordionContent>
                    <div className="w-full flex flex-row items-center space-evenly space-x-3">
                        <p>{truncatedAddress}</p>
                        <PositionIcon position={portalPosition} />
                        <p>{portalMass.toFixed(2)} ETH</p>
                        <ResourcesIcon resources={portalResources} />
                    </div>
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="bubbles">
                <AccordionTrigger className="font-semibold">Bubbles</AccordionTrigger>
                <AccordionContent className="w-full">
                    <ListBubbles bubbles={yourBubbles} />
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="liquidity">
                <AccordionTrigger className="font-semibold">Liquidity</AccordionTrigger>
                <AccordionContent>
                    You are not providing liquidity to any nodes.
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
};

export const TabAll = () => {
    const players: User[] = Object.values(currentState.users.reduce((acc, user) => (acc[user.address] = user, acc), {}));
        
    return (
        <Accordion
            type="multiple"
            className="w-full"
            defaultValue={["players", "liquidity"]}
        >
            <AccordionItem value="players">
                <AccordionTrigger className="font-semibold">Players</AccordionTrigger>
                <AccordionContent>
                    <ListPlayers players={players} />
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="liquidity">
                <AccordionTrigger className="font-semibold">Nodes</AccordionTrigger>
                <AccordionContent>
                    Node liquidity is not being provided by any players.
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
};

export const BarSide = () => {
    const [openPanel, setOpenPanel] = useState<boolean>(false);

    return (
        <Drawer.Root direction="right">
            <Drawer.Trigger asChild>
                <Button
                    className="fixed right-0 top-10"
                    size="icon"
                    color="white"
                    variant="outline"
                >
                    <ChevronLeftIcon />
                </Button>
            </Drawer.Trigger>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/40" />
                <Drawer.Content className="bg-white flex flex-col rounded-t-[10px] h-full w-[500px] mt-24 fixed bottom-0 right-0">
                    <ScrollArea>
                        <div className="p-4 bg-white flex-1 h-full">
                            <div className="max-w-md mx-auto">
                                <Drawer.Title className="font-medium font-bold mb-4">
                                    <h1 className="font-bold">World stats</h1>
                                </Drawer.Title>
                                <Tabs defaultValue="yours">
                                    <TabsList defaultValue={"yours"}>
                                        <TabsTrigger value="yours">
                                            Yours
                                        </TabsTrigger>
                                        <TabsTrigger value="all">All</TabsTrigger>
                                        <TabsTrigger value="leaderboard">
                                            Leaderboard
                                        </TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="yours">
                                        <TabYours />
                                    </TabsContent>
                                    <TabsContent value="all">
                                        <TabAll />
                                    </TabsContent>
                                    <TabsContent value="leaderboard"></TabsContent>
                                </Tabs>
                            </div>
                    </div>
                    </ScrollArea>
                    
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
};

{
    /*  */
}
