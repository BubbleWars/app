import { burnerAddress } from "@/config"
import { UserView } from "./UserView"
import { currentState } from "../../../../core/world";
import { PositionIcon, ResourcesIcon } from "./BarSide";

export const BarBottom = () => {
    const address = burnerAddress;
    const portal = currentState.portals.find(portal => portal.id.toLowerCase() == address.toLowerCase());
    const balance = portal?.mass ?? 0;
    const position = portal?.position ?? { x: 0, y: 0 }
    return (
        <div className="bg-white flex flex-row h-[10vh] w-full fixed bottom-0 right-0 space-x-4 p-4 items-center">
            <UserView address={address} />
            <div className="flex flex-col items-center">
                <p className="text-sm font-semibold">Position</p>
                <PositionIcon position={position} />
            </div>
            <div className="flex flex-col items-center">
                <p className="text-sm font-semibold">Mass</p>
                <p className="text-sm font-semibold">{balance.toFixed(2)}</p>
            </div>
            <div className="flex flex-col items-center">
                <p className="text-sm font-semibold">Resources</p>
                <ResourcesIcon resources={portal?.resources ?? []} />
            </div>
        </div>
    )
}