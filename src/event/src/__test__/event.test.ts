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
        // NOTE: Has to be caster for each component with their Events and EventsTypes
        e = new Event<Events, EventsTypes>();
    });

    it("Constructor", () => {
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
        expect(e.unsubscribeIndex(Events.PlayerConnection, 0)).toStrictEqual(
            CALLBACK_NEWLENGTH_NULL,
        );
        expect(e.unsubscribe(Events.PlayerConnection)).toStrictEqual(
            CALLBACK_NEWLENGTH_NULL,
        );
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
            e.subscribe(Events.PlayerConnection, {
                func: async (data: PlayerConnection) => {
                    playersCounter += 1;
                    totalEtherLobby += data.ether;

                    return Promise.resolve();
                },
                await: true,
            }),
        ).toBe(0);

        expect(
            e.subscribe(Events.PlayerConnection, {
                func: (data: PlayerConnection) => {
                    console.log(`Player just joined, id: ${data.playerId}`);
                    console.log(`At timestamp: ${data.timestamp.toString()}`);
                },
                await: true,
            }),
        ).toBe(1);

        expect(e.throw(Events.PlayerConnection, p)).toBe(undefined);

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

        const c1 = {
            func: async (data: GameStart) => {
                console.log(l1);
            },
            await: true,
        };
        const c2 = {
            func: (data: GameStart) => {
                console.log(l2);
            },
            await: true,
        };
        const c3 = {
            func: (data: GameStart) => {
                console.log(l3);
            },
            await: true,
        };

        e.subscribe(Events.GameEnd, {
            func: (data: GameEnd) => {},
            await: true,
        });
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

        expect(e.unsubscribe(Events.GameStart, 3)).toStrictEqual(
            CALLBACK_NEWLENGTH_NULL,
        );
        expect(e.unsubscribe(Events.GameStart, 0)).toStrictEqual({
            callback: c1,
            newLength: 1,
        });

        expect(
            e.throw(Events.GameStart, {
                ether: 1234,
                timestamp: 156790,
                playerId: "sjdDRRRR",
            }),
        ).toBe(undefined);

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
        var counter = 0;

        const l1 = "First checkss...";
        const l2 = "Game Started yayy";
        const l3 = "This is the final loading";

        const c0 = {
            func: (data: GameEnd) => {},
            await: true,
        };
        const c1 = {
            func: async (data: GameStart) => {
                console.log(l1);
                counter += 1;
            },
            await: true,
        };
        const c2 = {
            func: async (data: GameStart) => {
                await sleep(100); // 0.1s
                console.log(l2);
                counter += 1;
            },
            await: undefined,
        };
        const c3 = {
            func: (data: GameStart) => {
                console.log(l3);
                counter += 1;
            },
            await: true,
        };

        e.subscribe(Events.GameEnd, c0);
        e.subscribe(Events.GameStart, c1);
        e.subscribe(Events.GameStart, c2);
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

        e.throw(Events.GameStart, {
            ether: 1234,
            timestamp: 156790,
            playerId: "sjdDRRRR",
        });

        expect(consoleSpy).toHaveBeenCalledTimes(2);
        expect(consoleSpy).toHaveBeenNthCalledWith(1, l1);
        expect(consoleSpy).toHaveBeenNthCalledWith(2, l3);
        await sleep(200);
        expect(consoleSpy).toHaveBeenCalledTimes(3);
        expect(consoleSpy).toHaveBeenNthCalledWith(3, l2);
    });

    it("subscribeIndex", async () => {});
    it("unsubscribeCallback", async () => {});
});

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms || DEF_DELAY));
}
