import { Event } from "../event";
import {
    Events,
    EventsTypes,
    GameEnd,
    GameStart,
    PlayerConnection,
} from "../types/events.example";

const CALLBACK_NEWLENGTH_NULL = { callback: null, newLength: null };

describe("Event System Unit Tests", () => {
    // Console spy
    const consoleSpy = jest
        .spyOn(console, "log")
        .mockImplementation(() => undefined);
    var e = new Event<Events, EventsTypes>();

    afterEach(() => {
        //consoleSpy.mockReset();
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
        expect(e.unsubscribe(Events.PlayerConnection, 0)).toStrictEqual(
            CALLBACK_NEWLENGTH_NULL,
        );
        expect(e.popUnsubscribe(Events.PlayerConnection)).toStrictEqual(
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
            e.subscribe(Events.PlayerConnection, (data: PlayerConnection) => {
                playersCounter += 1;
                totalEtherLobby += data.ether;
            }),
        ).toBe(0);

        expect(
            e.subscribe(Events.PlayerConnection, (data: PlayerConnection) => {
                console.log(`Player just joined, id: ${data.playerId}`);
                console.log(`At timestamp: ${data.timestamp.toString()}`);
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

    it("Unsubscribe", () => {
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

        e.subscribe(Events.GameEnd, (data: GameEnd) => {});
        e.subscribe(Events.GameStart, c1);
        e.subscribe(Events.GameStart, c2);
        e.subscribe(Events.GameStart, c3);

        expect(e.hasCallback(Events.GameEnd)).toBe(true);
        expect(e.hasCallback(Events.GameStart)).toBe(true);
        expect(e.getNumberOfCallbacks(Events.GameStart)).toBe(3);

        expect(e.getCallback(Events.GameStart, 2)).toEqual(c3);

        expect(e.popUnsubscribe(Events.GameStart)).toEqual({
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

        expect(consoleSpy).toHaveBeenCalled();
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
});
