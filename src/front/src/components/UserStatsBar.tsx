import React, { useMemo } from "react";
import { burnerAddress } from "../config";
import { useAccount, useBalance } from "wagmi";
import { currentState } from "../../../core/world";
import "./UserStatsBar.css";

export const UserStatsBar = () => {
    const { address, isConnected } = useAccount();

    const { data, isError, isLoading } = useBalance({
        address: burnerAddress,
    });
    const balance = useMemo(() => {
        return parseFloat(data?.formatted ?? "0");
    }, [data]);

    const renderPortalBalance = () => {
        // Ensure addresses are compared in a case-insensitive manner
        const normalizedBurnerAddress = burnerAddress.toLowerCase();

        // Filter portals owned by the burnerAddress
        const burnerPortals = Array.from(currentState.portals.values()).filter(
            (portal) => portal.owner.toLowerCase() === normalizedBurnerAddress
        );

        // Map over the filtered portals and render their mass
        return burnerPortals.map((portal, index) => (
            <div key={index}>
                <p>Portal Balance: {portal.mass} ETH</p>
            </div>
        ));
    };

    const renderContent = () => {
        if (!isConnected) return <div>Please connect your wallet</div>;

        return (
            <>
                <h1>User Stats</h1>
                {/* <p>Address: {address}</p> */}
                <p> Address: {burnerAddress}</p>
                <p> Wallet Balance: {balance} </p>
                <p>{renderPortalBalance()} </p>
            </>
        );
    };

    return <div className="user-stats-bar">{renderContent()}</div>;
};
