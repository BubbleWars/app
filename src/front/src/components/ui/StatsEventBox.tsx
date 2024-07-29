import { useEffect, useRef, useState } from "react";
import { Event, EventsType } from "../../../../core/types/events";
import { useInterval } from "@/hooks/state";
import { events } from "../Game";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { SmallUserView } from "./UserView";


export const EventText = ({ event }: { event: Event }) => {
    
    switch (event.type){
        case EventsType.AbsorbBubble:
            return <div className="flex flex-row text-xs items-center">
                        <SmallUserView address={event.absorber} />  {event.isPortal ? "'s portal " : ""} absorbed {event.amount} from <SmallUserView address={event.absorbed} />
                    </div>
        case EventsType.AbsorbResource:
            return <div className="flex flex-row text-xs items-center">
                        <SmallUserView address={event.absorber} />  {event.isPortal ? "'s portal " : ""} absorbed {event.amount} from <SmallUserView address={event.absorbed} />
                    </div>
        case EventsType.BuyResource:
            return <div className="flex flex-row text-xs items-center">
                        <SmallUserView address={event.buyer} />  bought {event.amount}POINTS for {event.cost}ETH
                    </div>
        case EventsType.SellResource:
            return <div className="flex flex-row text-xs items-center">
                        <SmallUserView address={event.seller} />  sold {event.amount}POINTS for {event.cost}ETH
                    </div>
        case EventsType.PunctureBubble:
            return <div className="flex flex-row text-xs items-center">
                        <SmallUserView address={event.puncturerAddress} />  punctured <SmallUserView address={event.puncturedAddress} /> for {event.amount}ETH
                    </div>
        case EventsType.PunctureEmit:
            return <div className="flex flex-row text-xs items-center">
                        <SmallUserView address={event.puncturedAddress} />  lost {event.amount}ETH from puncture 
                    </div>
        case EventsType.SpawnPortal:
            return <div className="flex flex-row text-xs items-center">
                        <SmallUserView address={event.userAddress} />  spawned a portal for {event.amount}ETH
                    </div>
        case EventsType.EmitResource:
            return <div className="flex flex-row text-xs items-center">
                        <SmallUserView address={event.userAddress} />  {event.fromPortal ? "'s portal " : ""} emitted {event.amount}POINTS
                    </div>
        case EventsType.EmitBubble:
            return <div className="flex flex-row text-xs items-center">
                        <SmallUserView address={event.userAddress} />  {event.fromPortal ? "'s portal " : ""} emitted {event.amount}ETH
                    </div>
        default:
            return <p className="text-xs items-center">Unknown event</p>
    }
}
export const StatsEventBox = () => {
    const [list, setList] = useState<Event[]>([]);
    const scrollRef = useRef(null);

    useInterval(() => {
        console.log("new event", events);
        setList([...events]);
    }, 1000);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [list]);

    return (
        <div
            className="p-4 rounded-md border fixed right-0 bottom-[10vh]"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.8)", width:"500px" }}
        >
            <h1 className=" text-lg">Events</h1>
            <ScrollArea className="w-97 h-96" style={{ overflowY: "auto" }} ref={scrollRef}>
                {list.map((event, i) => (
                    <EventText key={i} event={event} />
                ))}
            </ScrollArea>
        </div>
    );
};