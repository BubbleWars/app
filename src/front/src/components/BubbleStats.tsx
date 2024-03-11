import React from "react";
import { burnerAddress } from "../config";
import { useDispatch, useSelector } from "react-redux";
import { useAccount } from "wagmi";
import { currentState } from "../../../core/world";
import { setLock } from "../store/interpolation";

export const BubbleStats = () => {
    const colors = [
        "#FF6384",
        "#36A2EB",
        "#FFCE56",
        "#cc65fe",
        "#ff6347",
        "#36a2eb",
    ];
    const { isConnected } = useAccount();
    const dispatch = useDispatch();
    const lock = useSelector((state: any) => state.interpolation.lock);

    const handleBubbleClick = (bubbleId: string) => {
        // Toggle lock between this bubble and no lock
        dispatch(setLock(lock === bubbleId ? null : bubbleId));
    };

    const renderUserBubbles = () => {
        const normalizedBurnerAddress = burnerAddress.toLowerCase();

        const userBubbles = Array.from(currentState.bubbles.values()).filter(
            (bubble) => bubble.owner.toLowerCase() === normalizedBurnerAddress,
        );

        return userBubbles.map((bubble, index) => {
            const color = colors[index % colors.length]; // Cycle through the colors
            return (
                <div
                    key={index}
                    onClick={() => handleBubbleClick(bubble.id)}
                    style={{
                        cursor: "pointer",
                        backgroundColor: color,
                        padding: "10px",
                        margin: "10px 0",
                        borderRadius: "5px",
                        color: "white",
                    }}
                >
                    <p>Bubble ID: {bubble.id.split("-")[1]}</p>
                    <p>Mass: {Number(bubble.mass).toFixed(3)}</p>
                </div>
            );
        });
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
