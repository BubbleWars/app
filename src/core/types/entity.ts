import { Body, Fixture } from "planck-js";
import { Address } from "./address";
import { ResourceType } from "./resource";

export interface Entity {
    from?: string;
    owner: Address;
    balance: number;
    body: Body;
    fixture: Fixture;
    resources?: Map<
        ResourceType,
        {
            resource: ResourceType;
            mass: number;
        }
    >;
}

export interface Attractor {
    to: string; // Entity to attract to
    from: string; //Entity being attracted
}
