import { useState } from "react";
import { User } from "../../../../core/types/user";
import { currentState } from "../../../../core/world";
import { ListPlayersLeaderboard } from "./BarSide";
import { useInterval } from "@/hooks/state";
import { Token } from "../../../../core/types/resource";

export const StatsTokenomics = () => {
    const [ price, setPrice ] = useState<number>(0);
    const [ marketcap, setMarketcap ] = useState<number>(0);
    const [ supply, setSupply ] = useState<number>(0);

    useInterval(() => {
        const node = currentState.nodes[0];
        if (!node) return;
        const token: Token = new Token(node.currentSupply, node.marketCap, node.k);
        console.log("otk info", token);
        setPrice(token.getBuyPrice(1));
        setMarketcap(token.marketCap);
        setSupply(token.currentSupply);
    },1000)

    return (
        <div className="flex flex-row h-[10vh] w-full fixed top-0 right-0 space-x-6 p-4 items-center align-center">
            <div className="bg-white border border-rounded p-4 flex flex-col items-left">
                <p className="text-sm font-semibold">Price POINTS</p>
                <p className="">{price.toFixed(7)} ETH</p>
            </div>
            <div className="bg-white border border-rounded p-4 flex flex-col items-left">
                <p className="text-sm font-semibold">Market Cap POINTS</p>
                <p className="">{marketcap.toFixed(8)} ETH</p>
            </div>
            <div className="bg-white border border-rounded p-4 flex flex-col items-left">
                <p className="text-sm font-semibold">Supply POINTS</p>
                <p className="">{supply.toFixed(2)} POINTS</p>
            </div>
        </div>
    );
}