import { useState } from "react";
import { User } from "../../../../core/types/user";
import { currentState } from "../../../../core/world";
import { ListPlayersLeaderboard } from "./BarSide";
import { useInterval } from "@/hooks/state";

export const StatsLeaderboard = () => {
    const [ players, setPlayers ] = useState<User[]>(Object.values(currentState.users.reduce((acc, user) => (acc[user.address] = user, acc), {})));
    useInterval(() => {
        setPlayers(Object.values(currentState.users.reduce((acc, user) => (acc[user.address] = user, acc), {})));
    },1000)
    return (
        <ListPlayersLeaderboard players={players} />
    );
}