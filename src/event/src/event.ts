export class Event<Events, EventsTypes> {
    private eventsMap = new Map<
        Events,
        [
            {
                func: (
                    data: EventsTypes,
                ) => Promise<void> | ((data: EventsTypes) => void);
                wait: Boolean;
            },
        ]
    >();

    /**
     * hasCallback checks wether the event has any callbacks
     * @param event Event Type
     * @returns true if the event already has a callback
     */
    public hasCallback(event: Events) {
        return this.eventsMap.has(event);
    }

    /**
     * getNumberOfCallbacks returns the number of callbacks
     * @param event Event Type
     * @returns the number of callbacks
     */
    public getNumberOfCallbacks(event: Events): number {
        if (!this.hasCallback(event)) {
            return 0;
        }

        let eCallbacks = this.eventsMap.get(event) as [
            {
                func: (
                    data: EventsTypes,
                ) => Promise<void> | ((data: EventsTypes) => void);
                wait: Boolean;
            },
        ];
        return eCallbacks.length;
    }

    /**
     * getCallback returns the callback based on the index
     * @param event Event Type
     * @param index Callback Index
     * @returns a callback or null
     */
    public getCallback(event: Events, index: number) {
        if (!this.hasCallback(event)) {
            return null;
        }

        if (index >= this.getNumberOfCallbacks(event)) {
            return null;
        }

        let eCallbacks = this.eventsMap.get(event) as [
            {
                func: (
                    data: EventsTypes,
                ) => Promise<void> | ((data: EventsTypes) => void);
                wait: Boolean;
            },
        ];
        return eCallbacks[index].func;
    }

    /**
     * subscribe appends a callback to the given event type
     * @param event Event Type
     * @param callback Callback Function
     * @param wait If awaits for asynchrronous callback, defaults to true
     * @returns the index of the subscribed callback
     */
    public subscribe(
        event: Events,
        callback: (
            data: EventsTypes,
        ) => Promise<void> | ((data: EventsTypes) => void),
        wait: Boolean = true,
    ): number {
        let clb = {
            func: callback,
            wait: wait,
        };

        if (clb.wait != true || clb.wait == undefined || clb.wait == null) {
            clb.wait = false;
        }

        if (!this.hasCallback(event)) {
            this.eventsMap.set(event, [clb]);
            return 0;
        }

        let callbacks = this.eventsMap.get(event) as [
            {
                func: (
                    data: EventsTypes,
                ) => Promise<void> | ((data: EventsTypes) => void);
                wait: Boolean;
            },
        ];
        let index = callbacks.push(clb) - 1;
        this.eventsMap.set(event, callbacks);
        return index;
    }

    /**
     * subscribeIndex insert a callback to the given event type, appends the callback
     * (subscribe) if the index is out of bound
     * @param event Event Type
     * @param index Index to insert at
     * @param callback Callback Function
     * @param wait If awaits for asynchronous callback, defaults to true
     * @returns the index of the subscribed callback,
     */
    public subscribeIndex(
        event: Events,
        index: number,
        callback: (
            data: EventsTypes,
        ) => Promise<void> | ((data: EventsTypes) => void),
        wait: Boolean = true,
    ): number {
        if (
            !this.hasCallback(event) ||
            this.getNumberOfCallbacks(event) <= index
        ) {
            return this.subscribe(event, callback, wait);
        }

        let clb = {
            func: callback,
            wait: wait,
        };

        if (clb.wait != true || clb.wait == undefined || clb.wait == null) {
            clb.wait = false;
        }

        let callbacks = this.eventsMap.get(event) as [
            {
                func: (
                    data: EventsTypes,
                ) => Promise<void> | ((data: EventsTypes) => void);
                wait: Boolean;
            },
        ];

        let previousPreviousCallback = callbacks[index];
        callbacks[index] = clb;
        for (let i = index + 1; i <= callbacks.length; ++i) {
            if (i == callbacks.length) {
                callbacks.push(previousPreviousCallback);
                break;
            }

            let previousCallback = callbacks[i];
            callbacks[i] = previousPreviousCallback;
            previousPreviousCallback = previousCallback;
        }

        this.eventsMap.set(event, callbacks);

        return index;
    }

    /**
     * throwSync throws the event and executes all callbacks, it does not wait for asynchronous
     * call that have been specified. From first to last. It cannot be waited
     * @param event Even Type
     * @param data Event Data
     * @returns null if there ar no callbacks, void if there are
     */
    public throw(event: Events, data: EventsTypes): void | null {
        if (!this.hasCallback(event)) {
            return null;
        }

        let callbacks = this.eventsMap.get(event) as [
            {
                func: (
                    data: EventsTypes,
                ) => Promise<void> | ((data: EventsTypes) => void);
                wait: Boolean;
            },
        ];

        for (const c of callbacks) {
            c.func(data);
        }
    }

    /**
     * throwAsync throws the event and executes all callbacks, it waits for asynchronous call
     * that have been specified. From first to last. It can be waited
     * @param event Even Type
     * @param data Event Data
     * @returns null if there ar no callbacks, void if there are
     */
    public async throwAsync(
        event: Events,
        data: EventsTypes,
    ): Promise<void | null> {
        if (!this.hasCallback(event)) {
            return null;
        }

        let callbacks = this.eventsMap.get(event) as [
            {
                func: (
                    data: EventsTypes,
                ) => Promise<void> | ((data: EventsTypes) => void);
                wait: Boolean;
            },
        ];

        for (const c of callbacks) {
            if (c.wait) {
                await c.func(data);
                continue;
            }

            c.func(data);
        }
    }

    /**
     * unsubscribeIndex unsubscribes a callback to the given event type at the given index
     * @param event Event Type
     * @param index Index to insert at
     * @param callback Callback Function
     * @param wait If awaits for asynchronous callback, defaults to false
     * @returns callback and the new callbacks length, if the index is out of bound returns
     * both the callback and the length as null
     */
    public unsubscribeIndex(event: Events, index: number) {
        if (
            !this.hasCallback(event) ||
            index >= this.getNumberOfCallbacks(event)
        ) {
            return { callback: null as null, newLength: null as null };
        }

        let callbacks = this.eventsMap.get(event) as [
            {
                func: (
                    data: EventsTypes,
                ) => Promise<void> | ((data: EventsTypes) => void);
                wait: Boolean;
            },
        ];
        let newLength: number | null = null;
        let unsubscribedCallback = callbacks[index];

        for (let i = index; i < callbacks.length - 1; ++i) {
            callbacks[i] = callbacks[i + 1];
        }

        callbacks.pop();
        newLength = callbacks.length;
        this.eventsMap.set(event, callbacks);

        return { callback: unsubscribedCallback.func, newLength: newLength };
    }

    /**
     * unsubscribeFirstCallback eliminates the first callback that match the desired from
     * the Event
     * @param event Event Type
     * @param callback Callback Function to eliminate
     * @returns the callback and the new callbacks length, if there are none it returns
     * both as null
     */
    public unsubscribeFirstCallback(
        event: Events,
        callback: (
            data: EventsTypes,
        ) => Promise<void> | ((data: EventsTypes) => void),
    ) {
        if (!this.hasCallback(event)) {
            return { callback: null as null, newLength: null as null };
        }

        let callbacks = this.eventsMap.get(event) as [
            {
                func: (
                    data: EventsTypes,
                ) => Promise<void> | ((data: EventsTypes) => void);
                wait: Boolean;
            },
        ];

        let index: number | null = null;

        for (let i = 0; i < callbacks.length; i++) {
            if (callbacks[i].func === callback) {
                index = i;
                break;
            }
        }

        if (index == null) {
            return { callback: null, newLength: null };
        }

        for (let i = index; i < callbacks.length - 1; i++) {
            callbacks[i] = callbacks[i + 1];
        }

        return { callback: callbacks.pop(), newLength: callbacks.length };
    }

    /**
     * unsubscribeAllCallback eliminates all callbacks that match the desired from
     * the Event
     * @param event Event Type
     * @param callback Callback Function to unsubscribe
     * @returns the callback and the new callbacks length, if there are none it returns
     * both as null
     */
    public unsubscribeAllCallback(
        event: Events,
        callback: (
            data: EventsTypes,
        ) => Promise<void> | ((data: EventsTypes) => void),
    ) {
        if (!this.hasCallback(event)) {
            return { callback: null as null, newLength: null as null };
        }

        // Can be improved
        let elementeleminated:
            | {
                  callback: {
                      func: (
                          data: EventsTypes,
                      ) => Promise<void> | ((data: EventsTypes) => void);
                      wait: Boolean;
                  };
                  newLength: number;
              }
            | { callback: null; newLength: null }
            | null = null;
        while (
            elementeleminated == null ||
            elementeleminated.callback?.func == callback
        ) {
            elementeleminated = this.unsubscribeFirstCallback(
                event,
                callback,
            ) as
                | {
                      callback: {
                          func: (
                              data: EventsTypes,
                          ) => Promise<void> | ((data: EventsTypes) => void);
                          wait: Boolean;
                      };
                      newLength: number;
                  }
                | { callback: null; newLength: null }
                | null;
        }
    }

    /**
     * unsubscribe pops the last callback of the Event
     * @param event Event Type
     * @returns the callback and the new callbacks length, if there are none it returns
     * both as null
     */
    public unsubscribe(event: Events) {
        if (!this.hasCallback(event)) {
            return { callback: null as null, newLength: null as null };
        }

        let callbacks = this.eventsMap.get(event) as [
            {
                func: (
                    data: EventsTypes,
                ) => Promise<void> | ((data: EventsTypes) => void);
                wait: Boolean;
            },
        ];
        let newLength = callbacks.length - 1;
        let callback = callbacks.pop();
        this.eventsMap.set(event, callbacks);

        return { callback: callback?.func, newLength: newLength };
    }

    /**
     * clear the event completely from callbacks
     * @param event Event Type
     */
    public clear(event: Events) {
        this.eventsMap.delete(event);
    }
}
