import { Event, EventsType } from "../types/events";

declare global {
    var events: Event[];
}

let onEvent = (event: Event) => {
    event;
};

export const setOnEvent = (callback: (event: Event) => void) => {
    onEvent = callback;
};

// Custom isEqual function for deep comparison
const isEqual = (obj1: any, obj2: any): boolean => {
    if (obj1 === obj2) return true;
    if (obj1 == null || obj2 == null) return false;
    if (typeof obj1 !== "object" || typeof obj2 !== "object") return false;

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    for (const key of keys1) {
        if (!keys2.includes(key)) return false;
        if (!isEqual(obj1[key], obj2[key])) return false;
    }

    return true;
};

export const addEvent = (event: Event) => {
    if (!global) return;
    if (!global.events) global.events = [];

    // Check if the event already exists
    const eventExists = global.events.some((e) => isEqual(e, event));
    if (eventExists) {
        console.log("Event already added", EventsType[event.type]);
        return;
    }

    global.events.push(event);
    onEvent(event);
    console.log("New event", EventsType[event.type]);
};

export const getEvents = (from: number, to: number) => {
    if (!global) return;
    if (!global.events) global.events = [];
    return global.events.filter(
        (e) => e.timestamp >= from && e.timestamp <= to,
    );
};

export const getAllEvents = () => {
    if (!global) return [];
    if (!global.events) global.events = [];
    return global.events;
};

export const clearEvents = () => {
    if (!global) return;
    if (!global.events) global.events = [];
    global.events = [];
};
