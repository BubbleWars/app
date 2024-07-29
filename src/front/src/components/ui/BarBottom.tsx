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
import { useCreateInput } from "@/hooks/inputs";
import { Input } from "postcss";
import { InputType } from "../../../../core/types/inputs";
import { useBalance } from "wagmi";
import { currentChain } from "@/contracts";

export const BubbleStateView = ({ bubbles }: { bubbles: BubbleState[] }) => {
    return (
        <div className="flex flex-row space-x-2">
            {bubbles.map((bubble, index) => (
                <div className="flex flex-col">
                    <p className="text-xs">Bubble #{index}</p>
                    <div className="flex flex-row space-x-2">
                        <MassView mass={bubble.mass} />
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

    const { data } = useBalance({
        address: connectedAddress,
        chainId: currentChain.id,
        watch: true,
    });

    const balanceBase = useMemo(() => {
        return parseFloat(data?.formatted ?? "0");
    }, [data]);



    const portal = currentState.portals.find(portal => portal.id.toLowerCase() == address.toLowerCase());
    const [ balance, setBalance ] = useState<number>(0);
    const [ position, setPosition ] = useState<{x: number, y: number}>({x: 0, y: 0});
    const [ resourceMass, setResourceMass ] = useState<number>(0);
    const [ bubbles, setBubbles ] = useState<BubbleState[]>([]);
    const [ needsToPayRent, setNeedsToPayRent ] = useState<boolean>(false);
    const [ rentDueAt, setRentDueAt ] = useState<number>(0);
    const [ rentAmount, setRentAmount ] = useState<number>(0);
    const [ rentDueIn, setRentDueIn ] = useState<number>(0);
    const [ payRentButtonText, setPayRentButtonText ] = useState<string>("");
    const [ payRentHeaderText, setPayRentHeaderText ] = useState<string>("");
    const [ payRentButtonEnabled, setPayRentButtonEnabled ] = useState<boolean>(true);

    const {
        isError,
        isLoading,
        submitTransaction,
    } = useCreateInput({
        type: InputType.PayRent,
    })

    useEffect(() => {
        const intervalId = setInterval(() => {
            const portal = currentState.portals.find(portal => portal.owner.toLowerCase() == address.toLowerCase());
           //console.log("These are the current portals 69:  ", currentState.portals);
            if(portal) {
                const user = currentState.users.find(user => user.address.toLowerCase() == address.toLowerCase());
                setBalance(portal.mass);
                setPosition(portal.position);
                setResourceMass(user.points ?? 0);
                setBubbles(currentState.bubbles.filter(bubble => bubble.owner.toLowerCase() == address.toLowerCase() && bubble.mass > PLANCK_MASS));
                setNeedsToPayRent(currentState.protocol.hasPayedRent.find((val => val == address)) != undefined)
                setRentDueAt(currentState.protocol.rentDueAt)
                setRentAmount(currentState.protocol.rentCost)
                setRentDueIn(rentDueAt - (Date.now()/1000))
                const portalResourceBalance = getPortalStateResourceMass(portal, ResourceType.ENERGY);
                const remaining = portalResourceBalance - rentAmount
                if(!needsToPayRent){
                    setPayRentButtonEnabled(false);
                    setPayRentButtonText("Rent Payed")
                    setPayRentHeaderText("Next rent cycle in: " + rentDueIn)
                }
                else if(remaining < 0){
                    setPayRentButtonEnabled(false);
                    setPayRentButtonText("Need " + Math.abs(remaining) + "POINTS to pay Rent")
                    setPayRentHeaderText("Must pay rent in: " + rentDueIn)
                } else if (isLoading) {
                    setPayRentButtonEnabled(false);
                    setPayRentButtonText("Paying...")
                    setPayRentHeaderText("Must pay rent in: " + rentDueIn)
                } else {
                    setPayRentButtonEnabled(true);
                    setPayRentButtonText("Pay Rent")
                    setPayRentHeaderText("Must pay rent in: " + rentDueIn)
                }

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
                <p className="text-sm font-semibold">Your Balance</p>
                <div className="flex flex-row space-x-2">
                    <p className=""><MassView mass={balanceBase} /></p>
                    
                        
                        
                    
                </div>
                
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
