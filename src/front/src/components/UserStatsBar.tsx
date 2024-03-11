import React, { useMemo } from "react";
import { burnerAddress } from "../config";
import { useAccount, useBalance } from "wagmi";
import { currentState } from "../../../core/world";
import { useDispatch, useSelector } from "react-redux";
import { setLock } from "../store/interpolation";
import "./UserStatsBar.css";

export const UserStatsBar = () => {
    const { address, isConnected } = useAccount();

    const { data, isError, isLoading } = useBalance({
        address: burnerAddress,
    });
    const balance = useMemo(
        () => parseFloat(data?.formatted ?? "0").toFixed(4),
        [data],
    );
    const dispatch = useDispatch();
    const lock = useSelector((state: any) => state.interpolation.lock);

    const shortenAddress = (address) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const renderPortalBalance = () => {
        // Ensure addresses are compared in a case-insensitive manner
        const normalizedBurnerAddress = burnerAddress.toLowerCase();

        // Filter portals owned by the burnerAddress
        const burnerPortals = Array.from(currentState.portals.values()).filter(
            (portal) => portal.owner.toLowerCase() === normalizedBurnerAddress,
        );

        // Map over the filtered portals and render their mass
        return burnerPortals.map((portal, index) => (
            <div key={index}>
                <p>
                    Portal Balance: {parseFloat(String(portal.mass)).toFixed(4)}{" "}
                    ETH
                </p>
                <button
                    onClick={() =>
                        dispatch(setLock(lock === portal.id ? null : portal.id))
                    }
                    style={{ padding: "2px 6px", fontSize: "0.75rem" }} // Very small button
                >
                    Jump to Portal
                </button>
            </div>
        ));
    };

    const renderContent = () => {
        if (!isConnected) return <div>Please connect your wallet</div>;

        return (
            <>
                <h1>User Stats</h1>
                {/* <p>Address: {address}</p> */}
                <div className="user-stat-field">
                    Address: {shortenAddress(burnerAddress)}
                </div>
                <div className="user-stat-field">Wallet Balance: {balance}</div>
                <p>{renderPortalBalance()} </p>
            </>
        );
    };

    return <div className="user-stats-bar">{renderContent()}</div>;
};
