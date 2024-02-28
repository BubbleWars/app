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

export const addEvent = (event: Event) => {
  if (!global) return;
  if (!global.events) global.events = [];
  global.events.push(event);
  onEvent(event);
};

export const getEvents = (from: number, to: number) => {
  if (!global) return;
  if (!global.events) global.events = [];
  return global.events.filter((e) => e.timestamp >= from && e.timestamp <= to);
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
