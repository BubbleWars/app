// privyApi.ts
import { PrivyClient } from "@privy-io/server-auth";
import { UserSocialSchema } from "./schema/WorldState";

const PRIVY_APP_ID = "cltnxig1e024xevlx99u3d12d";
const PRIVY_APP_SECRET =
    "5dAcUvbKpvUxK1hhcTq5omd66oafc9PMcjCEES7ARAM47G1p5SZZ4hCmP4Gb9FTJkbvg7XxGwANoAjM546RV9p9x";

const privy = new PrivyClient(PRIVY_APP_ID, PRIVY_APP_SECRET);

// @type("string") address: string = "";
// @type("string") pfpUrl: string = "";
// @type("string") social: string = "";
// @type("string") privyId: string = "";

export const fetchUsers = async () => {
    const users = await privy.getUsers();

    //return the userSocials as defined in schema
    return users.map((user) => {
        const newUser = new UserSocialSchema();
        newUser.privyId = user.id;
        newUser.address = user.wallet.address;

        if (user.farcaster) {
            newUser.social = user.farcaster.username;
            newUser.pfpUrl = user.farcaster.pfp;
        } else if (user.twitter) {
            newUser.social = user.twitter.username;
            newUser.pfpUrl = user.twitter.profilePictureUrl;
        } else if (user.discord) {
            newUser.social = user.discord.username;
            newUser.pfpUrl =
                "https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6918e57475a843f59f_icon_clyde_black_RGB.svg";
        }

        return newUser;
    });
};
