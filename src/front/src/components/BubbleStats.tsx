import React from "react";
import { burnerAddress } from "../config";
import { useDispatch, useSelector } from "react-redux";
import { useAccount } from "wagmi";
import { currentState } from "../../../core/world";
import { setLock } from "../store/interpolation";

export const BubbleStats = () => {
    const { isConnected } = useAccount();
    const dispatch = useDispatch();
    const lock = useSelector((state: any) => state.interpolation.lock);

    const handleBubbleClick = (bubbleId: string) => {
        // Toggle lock between this bubble and no lock
        dispatch(setLock(lock === bubbleId ? null : bubbleId));
    };

    const renderUserBubbles = () => {
        // Ensure addresses are compared in a case-insensitive manner
        const normalizedBurnerAddress = burnerAddress.toLowerCase();

        // Filter bubbles owned by the burnerAddress
        const userBubbles = Array.from(currentState.bubbles.values()).filter(
            (bubble) => bubble.owner.toLowerCase() === normalizedBurnerAddress
        );

        //display info for each of the user's bubbles
        return userBubbles.map((bubble, index) => (
            <div
                key={index}
                onClick={() => handleBubbleClick(bubble.id)}
                style={{ cursor: "pointer" }}
            >
                <p>Bubble ID: {bubble.id}</p>
                <p>Mass: {bubble.mass}</p>
                {/* Render other bubble properties as needed */}
            </div>
        ));
    };

    const renderContent = () => {
        if (!isConnected) return <div>Please connect your wallet</div>;

        return (
            <>
                <h1>Bubbles: </h1>
                <p>{renderUserBubbles()}</p>
            </>
        );
    };

    return <div className="bubble-stats">{renderContent()}</div>;
};
