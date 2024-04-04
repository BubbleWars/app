import { usePrivy } from "@privy-io/react-auth";
import { truncateAddress } from "../../../core/funcs/utils";

export const useDisplayName = (fallbackAddress) => {
    const { ready, authenticated, user } = usePrivy();

    // Compute and return the display name directly
    if (ready && authenticated && user) {
        if (user.discord) return `Discord: ${user.discord.username}`;
        if (user.twitter) return `Twitter: ${user.twitter.username}`;
        if (user.farcaster) return `Farcaster: ${user.farcaster.username}`;
        // Extend with more conditions as needed
        if (user.email) return `Email: ${user.email.address}`;
    }
    // Fallback if no user info is available
    return truncateAddress(fallbackAddress);
};
