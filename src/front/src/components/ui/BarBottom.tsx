import { UserView } from "./UserView";
import { currentState } from "../../../../core/world";
import { MassView, PositionIcon, ResourcesIcon } from "./BarSide";
import { useEffect, useMemo, useState } from "react";
import { Resource, ResourceType } from "../../../../core/types/resource";
import { ResourceState } from "../../../../core/types/state";
import { useFrame } from "@react-three/fiber";
import { useWallets } from "@privy-io/react-auth";

export const BarBottom = () => {
    const { wallets } = useWallets();

    const connectedAddress = wallets[0]?.address ? `${wallets[0].address}` : "";
    const address = connectedAddress;


    const portal = currentState.portals.find(portal => portal.id.toLowerCase() == address.toLowerCase());
    const [ balance, setBalance ] = useState<number>(0);
    const [ position, setPosition ] = useState<{x: number, y: number}>({x: 0, y: 0});
    const [ resources, setResources ] = useState<{resource: ResourceType, mass: number}[]>([]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            const portal = currentState.portals.find(portal => portal.id.toLowerCase() == address.toLowerCase());
            if(portal) {
                setBalance(portal.mass);
                setPosition(portal.position);
                setResources(portal.resources);
            }
        }, 1000)
        return () => clearInterval(intervalId);
    }, [])
    return (
        <div className="bg-white flex flex-row h-[10vh] w-full fixed bottom-0 right-0 space-x-6 p-4 items-center">
            <UserView address={address} />
            <div className="flex flex-col items-left">
                <p className="text-sm font-semibold">Position</p>
                <PositionIcon position={position} />
            </div>
            <div className="flex flex-col items-left">
                <p className="text-sm font-semibold">Mass</p>
                <p className=""><MassView mass={balance} /></p>
            </div>
            <div className="flex flex-col items-left">
                <p className="text-sm font-semibold">Resources</p>
                <ResourcesIcon resources={resources} />
            </div>
        </div>
    );
};
