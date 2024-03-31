import { ResourceNode, ResourceType } from "../types/resource";
import { Address } from "../types/address";
import { Body, Fixture, Vec2 } from "planck-js";
import { Circle } from "planck-js";
import { massToRadius } from "../funcs/utils";
import { ZeroAddress } from "ethers";
import { DAMPENING } from "../consts";
import { world } from "../world";

// Baseclass of resources
export class BaseResource implements ResourceNode {
    id: string; // Id of the resource
    resource: ResourceType; // Type of resource
    owner: Address; // Owner of the resource node
    balance: number;
    mass: number; // ETH mass injected into the node
    emitted: number; // amount of resource emitted
    pendingEthMass: number; // amount of ETH mass pending to be added to the node
    pendingResourceMass: number; // amount of resource added back to the node
    emissionDirection: { x: number; y: number }; // Direction of the emission
    lastEmission: number; //
    body: Body; // Game engine body of the node
    fixture: Fixture; // Game engine fixture of the node

    from?: string; // ?
    resources?: Map<
        ResourceType,
        {
            resource: ResourceType;
            mass: number;
        }
    >; // necessary?

    constructor(
        x: never,
        y: number,
        id: string,
        resource: ResourceType,
        owner: Address = ZeroAddress,
        balance: number,
        mass: number,
        emitted: number,
        pendingEthMass: number,
        pendingResourceMass: number,
        emissionDirection: { x: number; y: number },
        lastEmission: number,
        body: Body = world.createBody({
            position: Vec2(x, y),
            type: "dynamic",
            linearDamping: DAMPENING,
        }),
        fixture: Fixture = body.createFixture({
            shape: Circle(massToRadius(mass)),
            density: 1,
            restitution: 0,
            friction: 0,
        }),
        from?: string,
        resources?: Map<
            ResourceType,
            {
                resource: ResourceType;
                mass: number;
            }
        >,
    ) {
        this.id = id;
        this.resource = resource;
        this.owner = owner;
        this.balance = balance;
        this.mass = mass;
        this.emitted = emitted;
        this.pendingEthMass = pendingEthMass;
        this.pendingResourceMass = pendingResourceMass;
        this.emissionDirection = emissionDirection;
        this.lastEmission = lastEmission;
        this.body = body;
        this.fixture = fixture;
        this.from = from;
        this.resources = resources;
    }

    updateNode(newMass: number, newEmitted?: number) {
        this.mass = newMass;
        if (newEmitted) this.emitted = newEmitted;

        this.body.destroyFixture(this.fixture);
        this.fixture = this.body.createFixture({
            shape: Circle(massToRadius(Math.max(this.mass, 1))),
            density: 1,
            restitution: 0,
            friction: 0,
        });
    }
}
