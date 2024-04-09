import { UserView } from "./UserView";
import { currentState } from "../../../../core/world";
import { PositionIcon, ResourcesIcon } from "./BarSide";
import { useWallets } from "@privy-io/react-auth";

export const BarBottom = () => {
    const { wallets } = useWallets();

    const connectedAddress = wallets[0]?.address ? `${wallets[0].address}` : "";
    const address = connectedAddress;

    const portal = currentState.portals.find(
        (portal) => portal.id.toLowerCase() == address.toLowerCase(),
    );
    const balance = portal?.mass ?? 0;
    const position = portal?.position ?? { x: 0, y: 0 };
    return (
        <div className="bg-white flex flex-row h-[10vh] w-full fixed bottom-0 right-0 space-x-6 p-4 items-center">
            <UserView address={address} />
            <div className="flex flex-col items-left">
                <p className="text-sm font-semibold">Position</p>
                <PositionIcon position={position} />
            </div>
            <div className="flex flex-col items-left">
                <p className="text-sm font-semibold">Mass</p>
                <p className="">{balance.toFixed(2)} ETH</p>
            </div>
            <div className="flex flex-col items-left">
                <p className="text-sm font-semibold">Resources</p>
                <ResourcesIcon resources={portal?.resources ?? []} />
            </div>
        </div>
    );
};
