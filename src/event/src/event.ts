export class Event<Events, EventsTypes> {
    private eventsMap = new Map<Events, [(data: EventsTypes) => void]>();

    // Returns if the event already has or not a callback
    public hasCallback(event: Events) {
        return this.eventsMap.has(event);
    }

    // Returns the number of callbacks for a given event
    public getNumberOfCallbacks(event: Events): number {
        if (!this.hasCallback(event)) {
            return 0;
        }

        let eCallbacks = this.eventsMap.get(event) as [
            (data: EventsTypes) => void,
        ];
        return eCallbacks.length;
    }

    // Returns the callback based on the index
    public getCallback(event: Events, index: number) {
        if (!this.hasCallback(event)) {
            return null;
        }

        if (index >= this.getNumberOfCallbacks(event)) {
            return null;
        }

        let eCallbacks = this.eventsMap.get(event) as [
            (data: EventsTypes) => void,
        ];
        return eCallbacks[index];
    }

    // Subscribes a callback to an event, returns the callback index
    public subscribe(
        event: Events,
        callback: (data: EventsTypes) => void,
    ): number {
        if (!this.hasCallback(event)) {
            this.eventsMap.set(event, [callback]);
            return 0;
        }

        let callbacks = this.eventsMap.get(event) as [
            (data: EventsTypes) => void,
        ];
        let index = callbacks.push(callback) - 1;
        this.eventsMap.set(event, callbacks);
        return index;
    }

    // Throws the event by calling each callback subscribed to it,
    // from first to last subscribed
    public throw(event: Events, data: EventsTypes): void | null {
        if (!this.hasCallback(event)) {
            return null;
        }

        let callbacks = this.eventsMap.get(event) as [
            (data: EventsTypes) => void,
        ];

        callbacks.forEach((c) => {
            c(data);
        });
    }

    // Unsubscribes a callback from the event, if the index does not exists
    // it will return both a null callback in new index.
    public unsubscribe(event: Events, index: number) {
        if (!this.hasCallback(event)) {
            return { callback: null as null, newLength: null as null };
        }

        let callbacks = this.eventsMap.get(event) as [
            (data: EventsTypes) => void,
        ];
        let newLength: number | null = null;

        let unsubscribedCallback: { (data: EventsTypes): void } | null =
            index >= callbacks.length ? null : callbacks[index];
        if (unsubscribedCallback != null) {
            for (let i = index; i < callbacks.length - 1; ++i) {
                callbacks[i] = callbacks[i + 1];
            }

            callbacks.pop();
            newLength = callbacks.length;
            this.eventsMap.set(event, callbacks);
        }

        return { callback: unsubscribedCallback, newLength: newLength };
    }

    // Unsubscribes the last callback added to an event, returns
    // it and the new length of the callbacks
    public popUnsubscribe(event: Events) {
        if (!this.hasCallback(event)) {
            return { callback: null as null, newLength: null as null };
        }

        let callbacks = this.eventsMap.get(event) as [
            (data: EventsTypes) => void,
        ];
        let newLength = callbacks.length - 1;
        let callback = callbacks.pop();
        this.eventsMap.set(event, callbacks);

        return { callback: callback, newLength: newLength };
    }

    // Completely clears an event callbacks
    public clear(event: Events) {
        this.eventsMap.delete(event);
    }
}
