import { Event } from "../event";
import {
    Events,
    EventsTypes,
    GameEnd,
    GameStart,
    PlayerConnection,
} from "../types/events.example";

const CALLBACK_NEWLENGTH_NULL = { callback: null, newLength: null };
const DEF_DELAY = 1000;

describe("Event System Unit Tests", () => {
    // Console spy
    const consoleSpy = jest
        .spyOn(console, "log")
        .mockImplementation(() => undefined);
    var e = new Event<Events, EventsTypes>();

    afterEach(() => {
        consoleSpy.mockReset();
        // NOTE: Has to be casted for each component with their Events and EventsTypes
        e = new Event<Events, EventsTypes>();
    });

    it("Constructor", async () => {
        // Check state
        expect(e.hasCallback(Events.GameEnd)).toBe(false);
        expect(e.getNumberOfCallbacks(Events.PlayerConnection)).toBe(0);
        expect(e.getCallback(Events.PlayerConnection, 0)).toBe(null);
        expect(e.getCallback(Events.GameStart, 999)).toBe(null);

        expect(
            e.throw(Events.PlayerDeath, {
                timestamp: 1234,
                playerId: "",
                byPlayerId: "",
            }),
        ).toBe(null);
        expect(
            await e.throwAsync(Events.PlayerDeath, {
                timestamp: 1234,
                playerId: "",
                byPlayerId: "",
            }),
        ).toBe(null);
        expect(e.unsubscribeIndex(Events.PlayerConnection, 0)).toStrictEqual(
            CALLBACK_NEWLENGTH_NULL,
        );
        expect(e.unsubscribe(Events.PlayerConnection)).toStrictEqual(
            CALLBACK_NEWLENGTH_NULL,
        );
        expect(
            e.unsubscribeFirstCallback(
                Events.GameStart,
                (_data: EventsTypes) => {},
            ),
        ).toStrictEqual(CALLBACK_NEWLENGTH_NULL);
    });

    it("Subscribe", () => {
        var p: PlayerConnection = {
            ether: 1234,
            playerId: "sus",
            timestamp: 156649,
        };
        var playersCounter = 0;
        var totalEtherLobby = 0;

        expect(
            e.subscribe(
                Events.PlayerConnection,
                async (data: PlayerConnection) => {
                    playersCounter += 1;
                    totalEtherLobby += data.ether;

                    return Promise.resolve();
                },
            ),
        ).toBe(0);

        expect(
            e.subscribe(Events.PlayerConnection, (data: PlayerConnection) => {
                console.log(`Player just joined, id: ${data.playerId}`);
                console.log(`At timestamp: ${data.timestamp.toString()}`);
            }),
        ).toBe(1);

        e.throw(Events.PlayerConnection, p);

        expect(consoleSpy).toHaveBeenCalledTimes(2);
        expect(consoleSpy).toHaveBeenNthCalledWith(
            1,
            `Player just joined, id: ${p.playerId}`,
        );
        expect(consoleSpy).toHaveBeenNthCalledWith(
            2,
            `At timestamp: ${p.timestamp.toString()}`,
        );

        expect(playersCounter).toBe(1);
        expect(totalEtherLobby).toBe(1234);
    });

    it("Throw, Unsubscribe", () => {
        const l1 = "First checkss...";
        const l2 = "Game Started yayy";
        const l3 = "This is the final loading";

        const c1 = async (data: GameStart) => {
            console.log(l1);
        };
        const c2 = (data: GameStart) => {
            console.log(l2);
        };
        const c3 = (data: GameStart) => {
            console.log(l3);
        };

        e.subscribe(Events.GameEnd, (data: GameEnd) => {});
        e.subscribe(Events.GameStart, c1);
        e.subscribe(Events.GameStart, c2);
        e.subscribe(Events.GameStart, c3);

        expect(e.hasCallback(Events.GameEnd)).toBe(true);
        expect(e.hasCallback(Events.GameStart)).toBe(true);
        expect(e.getNumberOfCallbacks(Events.GameStart)).toBe(3);

        expect(e.getCallback(Events.GameStart, 2)).toEqual(c3);

        expect(e.unsubscribe(Events.GameStart)).toEqual({
            callback: c3,
            newLength: 2,
        });

        expect(e.unsubscribeIndex(Events.GameStart, 3)).toStrictEqual(
            CALLBACK_NEWLENGTH_NULL,
        );
        expect(e.unsubscribeIndex(Events.GameStart, 0)).toStrictEqual({
            callback: c1,
            newLength: 1,
        });

        e.throw(Events.GameStart, {
            ether: 1234,
            timestamp: 156790,
            playerId: "sjdDRRRR",
        });
        expect(consoleSpy).toHaveBeenCalledTimes(1);
        expect(consoleSpy).toHaveBeenCalledWith(l2);

        expect(
            e.getCallback(
                Events.GameStart,
                e.getNumberOfCallbacks(Events.GameStart) + 1,
            ),
        ).toBe(null);

        expect(e.clear(Events.GameEnd)).toBe(undefined);
        expect(e.clear(Events.GameStart)).toBe(undefined);

        expect(e.hasCallback(Events.GameEnd)).toBe(false);
        expect(e.getNumberOfCallbacks(Events.GameEnd)).toBe(0);
        expect(e.hasCallback(Events.GameStart)).toBe(false);
        expect(e.getNumberOfCallbacks(Events.GameStart)).toBe(0);
    });

    it("Async", async () => {
        const l1 = "First checkss...";
        const l2 = "Game Started yayy";
        const l3 = "This is the final loading";

        const c0 = (data: GameEnd) => {};
        const c1 = async (data: GameStart) => {
            console.log(l1);
        };
        const c2 = async (data: GameStart) => {
            await sleep(400); // 0.4s
            console.log(l2);
        };
        const c3 = (data: GameStart) => {
            console.log(l3);
        };

        e.subscribe(Events.GameEnd, c0);
        e.subscribe(Events.GameStart, c1);
        e.subscribe(Events.GameStart, c2, false);
        e.subscribe(Events.GameStart, c3);

        expect(e.hasCallback(Events.GameEnd)).toBe(true);
        expect(e.hasCallback(Events.GameStart)).toBe(true);
        expect(e.getNumberOfCallbacks(Events.GameStart)).toBe(3);

        expect(e.getCallback(Events.GameStart, 2)).toEqual(c3);

        expect(e.unsubscribeIndex(Events.GameStart, 4)).toStrictEqual(
            CALLBACK_NEWLENGTH_NULL,
        );
        expect(e.unsubscribeIndex(Events.GameEnd, 0)).toStrictEqual({
            callback: c0,
            newLength: 0,
        });

        expect(consoleSpy).toHaveBeenCalledTimes(0);

        await e.throwAsync(Events.GameStart, {
            ether: 1234,
            timestamp: 156790,
            playerId: "sjdDRRRR",
        });

        expect(consoleSpy).toHaveBeenCalledTimes(2);
        expect(consoleSpy).toHaveBeenNthCalledWith(1, l1);
        expect(consoleSpy).toHaveBeenNthCalledWith(2, l3);
        await sleep(700);
        expect(consoleSpy).toHaveBeenCalledTimes(3);
        expect(consoleSpy).toHaveBeenNthCalledWith(3, l2);

        e.clear(Events.GameStart);
        expect(e.getNumberOfCallbacks(Events.GameStart)).toBe(0);
        e.subscribe(Events.GameStart, c1);
        e.subscribe(Events.GameStart, c2, true);
        e.subscribe(Events.GameStart, c3);
        expect(e.getNumberOfCallbacks(Events.GameStart)).toBe(3);

        await e.throwAsync(Events.GameStart, {
            ether: 1234,
            timestamp: 156790,
            playerId: "sjdDRRRR",
        });

        expect(consoleSpy).toHaveBeenCalledTimes(6);
        expect(consoleSpy).toHaveBeenNthCalledWith(4, l1);
        expect(consoleSpy).toHaveBeenNthCalledWith(5, l2);
        expect(consoleSpy).toHaveBeenNthCalledWith(6, l3);
    });

    it("subscribeIndex", async () => {
        const l1 = "First checkss...";
        const l2 = "Game Started yayy";
        const l3 = "This is the final loading";

        const c1 = async (data: GameStart) => {
            console.log(l1);
        };
        const c2 = async (data: GameStart) => {
            console.log(l2);
        };
        const c3 = (data: GameStart) => {
            console.log(l3);
        };

        e.subscribe(Events.GameStart, c1);
        e.subscribe(Events.GameStart, c2);
        e.subscribe(Events.GameStart, c3);

        e.subscribeIndex(Events.GameStart, 10, c3);
        e.subscribeIndex(Events.GameStart, 3, c2);
        e.subscribeIndex(Events.GameStart, 4, c1);
        e.subscribeIndex(Events.GameStart, 1, c1);

        e.throw(Events.GameStart, {
            ether: 1234,
            timestamp: 156790,
            playerId: "sjdDRRRR",
        });

        expect(consoleSpy).toHaveBeenCalledTimes(7);
        expect(consoleSpy).toHaveBeenNthCalledWith(1, l1);
        expect(consoleSpy).toHaveBeenNthCalledWith(2, l1);
        expect(consoleSpy).toHaveBeenNthCalledWith(3, l2);
        expect(consoleSpy).toHaveBeenNthCalledWith(4, l3);
        expect(consoleSpy).toHaveBeenNthCalledWith(5, l2);
        expect(consoleSpy).toHaveBeenNthCalledWith(6, l1);
        expect(consoleSpy).toHaveBeenNthCalledWith(7, l3);
    });

    it("unsubscribeCallback", async () => {
        const l1 = "First checkss...";
        const l2 = "Game Started yayy";
        const l3 = "This is the final loading";

        const c1 = (data: GameStart) => {
            console.log(l1);
        };
        const c2 = (data: GameStart) => {
            console.log(l2);
        };
        const c3 = (data: GameStart) => {
            console.log(l3);
        };

        e.subscribe(Events.GameStart, c1);
        e.subscribe(Events.GameStart, c2);
        e.subscribe(Events.GameStart, c3);
        e.subscribe(Events.GameStart, c1);
        e.subscribe(Events.GameStart, c2);
        e.subscribe(Events.GameStart, c3);

        e.throw(Events.GameStart, {
            ether: 1234,
            timestamp: 156790,
            playerId: "sjdDRRRR",
        });

        expect(consoleSpy).toHaveBeenCalledTimes(6);
        expect(consoleSpy).toHaveBeenNthCalledWith(1, l1);
        expect(consoleSpy).toHaveBeenNthCalledWith(2, l2);
        expect(consoleSpy).toHaveBeenNthCalledWith(3, l3);
        expect(consoleSpy).toHaveBeenNthCalledWith(4, l1);
        expect(consoleSpy).toHaveBeenNthCalledWith(5, l2);
        expect(consoleSpy).toHaveBeenNthCalledWith(6, l3);

        e.unsubscribeFirstCallback(Events.GameStart, c3);

        e.throw(Events.GameStart, {
            ether: 1234,
            timestamp: 156790,
            playerId: "sjdDRRRR",
        });

        expect(consoleSpy).toHaveBeenCalledTimes(11);
        expect(consoleSpy).toHaveBeenNthCalledWith(7, l1);
        expect(consoleSpy).toHaveBeenNthCalledWith(8, l2);
        expect(consoleSpy).toHaveBeenNthCalledWith(9, l1);
        expect(consoleSpy).toHaveBeenNthCalledWith(10, l2);
        expect(consoleSpy).toHaveBeenNthCalledWith(11, l3);

        expect(
            e.unsubscribeFirstCallback(
                Events.GameStart,
                (_data: EventsTypes) => {},
            ),
        ).toStrictEqual(CALLBACK_NEWLENGTH_NULL);
    });

    it("unsubscribeAllCallback", async () => {});
});

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms || DEF_DELAY));
}
