import { useAccount, useConnect } from "wagmi";
import { InjectedConnector } from "wagmi/connectors/injected";
import { ActionSpawnPortal } from "./ActionSpawnPortal";
import { ActionDeposit } from "./ActionDeposit";
import { ActionEmit } from "./ActionEmit";
import { ActionWithdraw } from "./ActionWithdraw";

export const GameBar = () => {
    const { address, isConnected, isConnecting } = useAccount();
    const { connect } = useConnect({ connector: new InjectedConnector() });

    const ProfileButton = () => {
        if (isConnected) return <div>Connected to {address}</div>;
        if (isConnecting) return <div>Connecting...</div>;
        return <button onClick={() => connect()}>Connect</button>;
    };

    return (
        <div className="game-bar">
            <ProfileButton />
            {isConnected && (
                <>
                    <ActionDeposit />
                    <ActionWithdraw />
                    <ActionSpawnPortal />
                    <ActionEmit address={address ?? ""} />
                </>
            )}
        </div>
    );
};
