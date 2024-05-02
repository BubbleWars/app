import { ethers } from "ethers";
import { Edge, Vec2, World } from "planck-js";
import { C, MASS_ENERGY_CONVERSION_EFFICIENCY, MAX_VELOCITY, MIN_DELTA_VELOCITY, PLANCK_MASS } from "../consts";

export const massToRadius = (mass: number): number => {
    return Math.sqrt(mass / Math.PI);
};

export const radiusToMass = (radius: number): number => {
    return Math.PI * radius * radius;
};

export const calculateEmissionVelocity = (m1: number, m2: number): number => {
    // const alpha = 0.05; // Example scaling factor
    // const ejectFactor = Math.pow((m1/m2), alpha); // Non-linear scaling
    // const vMax = C * Math.sqrt(2); // Maximum velocity from Total Energy = mc^2
    // console.log("emission velocity", MASS_ENERGY_CONVERSION_EFFICIENCY * vMax)
    // const emissionVelocity = MASS_ENERGY_CONVERSION_EFFICIENCY * vMax;
    return MAX_VELOCITY;
};

export const calculateEjectionVelocity = (direction: Vec2): Vec2 => {
    const ejectionVelocity = direction.clone();
    ejectionVelocity.normalize();
    ejectionVelocity.mul(calculateEmissionVelocity(1, 1));
    return ejectionVelocity;
}

export const calculateDeltaVelocity = (ve: Vec2, m:number, me: number): Vec2 => {
    const deltaVelocity = ve.clone().neg();

    const minDeltaVeclocity = deltaVelocity.clone();
    minDeltaVeclocity.normalize();
    minDeltaVeclocity.mul(MIN_DELTA_VELOCITY);
    
    deltaVelocity
        .sub(minDeltaVeclocity)
        .mul(Math.sqrt((me - PLANCK_MASS)/((m/PLANCK_MASS)-PLANCK_MASS)))
        .add(minDeltaVeclocity);

    //console.log("delta velocity", deltaVelocity.length());

    return deltaVelocity;
}

export const createBoundary = (
    world: World,
    a: Vec2,
    b: Vec2,
) => {
    world.createBody().createFixture(Edge(a, b), {
        restitution: 1,
    });
};

export const createEdges = (
    world: World,
    width: number,
    height: number,
) => {
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    createBoundary(world, Vec2(-halfWidth, -halfHeight), Vec2(halfWidth, -halfHeight));
    createBoundary(world, Vec2(halfWidth, -halfHeight), Vec2(halfWidth, halfHeight));
    createBoundary(world, Vec2(halfWidth, halfHeight), Vec2(-halfWidth, halfHeight));
    createBoundary(world, Vec2(-halfWidth, halfHeight), Vec2(-halfWidth, -halfHeight));
}

export const decodePacked = (types: string[], data: string) => {
    let offset = 2;
    let decoded: any[] = [];

    for (let type of types) {
        switch (type) {
            case "bool":
                // Booleans are 1 byte, but in packed form, they might be represented differently
                decoded.push(data.slice(offset, offset + 2) === "01");
                offset += 2; // Increment by 2 characters (1 byte in hex)
                break;
            case "address":
                // Addresses are 20 bytes (40 hex characters)
                decoded.push("0x" + data.slice(offset, offset + 40));
                offset += 40; // Increment by 40 characters (20 bytes in hex)
                break;
            case "uint256":
                // uint256 are 32 bytes (64 hex characters)
                decoded.push(
                    Number(
                        ethers.formatEther(
                            BigInt("0x" + data.slice(offset, offset + 64)),
                        ),
                    ),
                );
                offset += 64; // Increment by 64 characters (32 bytes in hex)
                break;
            default:
                throw new Error(`Unsupported type: ${type}`);
        }
    }

    return decoded;
};

export const truncateAddress = (
    address: string,
    length: number = 4,
): string => {
    return address.slice(0, 2 + length) + ".." + address.slice(-length);
};

export const ethereumAddressToColor = (ethAddress: string) => {
    if (
        !ethAddress ||
        ethAddress.length !== 42 ||
        !ethAddress.startsWith("0x")
    ) {
        return "#000000";
    }

    // Use the first six characters after '0x' as the color code
    const colorCode = ethAddress.substring(2, 8);

    return `#${colorCode}`;
};
