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
    attractor?: string;
}
