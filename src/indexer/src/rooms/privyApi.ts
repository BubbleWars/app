// privyApi.ts
import fetch from "node-fetch";

const PRIVY_APP_ID = "cltnxig1e024xevlx99u3d12d";
const PRIVY_APP_SECRET =
    "5dAcUvbKpvUxK1hhcTq5omd66oafc9PMcjCEES7ARAM47G1p5SZZ4hCmP4Gb9FTJkbvg7XxGwANoAjM546RV9p9x";

const fetchPageOfUsers = async (cursor?: string) => {
    const url =
        "https://auth.privy.io/api/v1/users" +
        (cursor ? `?cursor=${cursor}` : "");
    const response = await fetch(url, {
        method: "GET",
        headers: {
            Authorization: `Basic ${Buffer.from(`${PRIVY_APP_ID}:${PRIVY_APP_SECRET}`).toString("base64")}`,
            "privy-app-id": PRIVY_APP_ID,
        },
    });
    return response.json();
};

export const fetchAllUsers = async () => {
    let cursor;
    let query: any;
    let users: any = [];
    do {
        query = await fetchPageOfUsers(cursor);
        users = users.concat(query.data);
        cursor = query.next_cursor;
    } while (cursor !== null);
    return users;
};
