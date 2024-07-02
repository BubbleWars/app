import { UserView } from "./UserView";
import { currentState } from "../../../../core/world";
import { MassView, PositionIcon, ResourceMassView, ResourcesIcon } from "./BarSide";
import { useEffect, useMemo, useState } from "react";
import { Resource, ResourceType } from "../../../../core/types/resource";
import { BubbleState, ResourceState } from "../../../../core/types/state";
import { useFrame } from "@react-three/fiber";
import { useWallets } from "@privy-io/react-auth";
import { useUserSocial } from "@/hooks/socials";
import { getPortalStateResourceMass } from "../../../../core/funcs/portal";
import { PLANCK_MASS } from "../../../../core/consts";
import { getBubbleStateResourceMass } from "../../../../core/funcs/bubble";

export const BubbleStateView = ({ bubbles }: { bubbles: BubbleState[] }) => {
    return (
        <div className="flex flex-row space-x-2">
            {bubbles.map((bubble, index) => (
                <div className="flex flex-col">
                    <p className="text-xs">Bubble #{index}</p>
                    <div className="flex flex-row space-x-2">
                        <MassView mass={bubble.mass} />
                        <ResourceMassView mass={getBubbleStateResourceMass(bubble, ResourceType.ENERGY)} />
                    </div>
                </div>
            ))}
        </div>
    );
}

export const BarBottom = () => {
    const { wallets } = useWallets();

    const connectedAddress = wallets[0]?.address ? `${wallets[0].address}` : "";
    const address = connectedAddress;



    const portal = currentState.portals.find(portal => portal.id.toLowerCase() == address.toLowerCase());
    const [ balance, setBalance ] = useState<number>(0);
    const [ position, setPosition ] = useState<{x: number, y: number}>({x: 0, y: 0});
    const [ resourceMass, setResourceMass ] = useState<number>(0);
    const [ bubbles, setBubbles ] = useState<BubbleState[]>([]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            const portal = currentState.portals.find(portal => portal.owner.toLowerCase() == address.toLowerCase());
           //console.log("These are the current portals 69:  ", currentState.portals);
            if(portal) {
                setBalance(portal.mass);
                setPosition(portal.position);
                setResourceMass(getPortalStateResourceMass(portal, ResourceType.ENERGY))
                setBubbles(currentState.bubbles.filter(bubble => bubble.owner.toLowerCase() == address.toLowerCase() && bubble.mass > PLANCK_MASS));
            }
        }, 1000)
        return () => clearInterval(intervalId);
    }, [address])
    return (
        <div className="bg-white flex flex-row h-[10vh] w-full fixed bottom-0 right-0 space-x-6 p-4 items-center">
            <UserView address={address} />
            <div className="flex flex-col items-left">
                <p className="text-sm font-semibold">Position</p>
                <PositionIcon position={position} />
            </div>
            <div className="flex flex-col items-left">
                <p className="text-sm font-semibold">Your Portal</p>
                <div className="flex flex-row space-x-2">
                    <p className=""><MassView mass={balance} /></p>
                    <p className="text-xs"><ResourceMassView mass={resourceMass} /></p>
                </div>
                
            </div>
            <div className="flex flex-col items-left">
                <p className="text-sm font-semibold">Your Bubbles</p>
                <div className="flex flex-row space-x-2">
                    <BubbleStateView bubbles={bubbles} />
                </div>
            </div>
        </div>
    );
};
