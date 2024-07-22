import { ethers } from "ethers";
import { Chain, Circle, Edge, Vec2, World } from "planck-js";
import { C, MASS_ENERGY_CONVERSION_EFFICIENCY, MAX_VELOCITY, MIN_DELTA_VELOCITY, PLANCK_MASS } from "../consts";
import { setBodyId } from "./obstacle";

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
    ////console.log("emission velocity", MASS_ENERGY_CONVERSION_EFFICIENCY * vMax)
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
        .mul(Math.sqrt((me)/((m))))
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

// Create circular boundary with internal collision
export const createEdges = (
    world: World, 
    radius: number
) => {
    const count = 500;
    const vertices = [];
    const angleStep = (2 * Math.PI) / count;

    // Calculate the vertices along the circumference
    for (let i = 0; i < count; i++) {
        const angle = i * angleStep;
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        vertices.push(Vec2(x, y));
    }

    // Close the loop by adding the first vertex at the end
    vertices.push(vertices[0]);

    // Create the static body for the boundary
    const boundary = world.createBody({
        position: Vec2(0, 0)
    });

    // Create a chain fixture for the boundary
    const chainFixture = {
        shape: Chain(vertices),
        density: 0,
        friction: 0.3,
        restitution: 1.0 // Ensure that objects bounce perfectly
    };

    boundary.createFixture(chainFixture);
};

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
                        ethers.utils.formatEther(
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

export const ethereumAddressToColor = (ethAddress: `0x${string}`): string => {
    return getAddressColor(ethAddress, 250);
};

export const  preciseRound = (num: number, decimalPlaces: number): number => {
    const factor = Math.pow(10, decimalPlaces);
    return Math.round((num + Number.EPSILON) * factor) / factor;
}

export const clipDecimals = (num: number, decimalPlaces: number): number => {
    const factor = Math.pow(10, decimalPlaces);
    return Math.floor(num * factor) / factor;
}

function hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');   // convert to Hex and prefix "0" if needed
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

export function getColorFromPalette(index, maxColors) {
    // Calculate the increment based on the maxColors
    const increment = 360 / maxColors;

    // Calculate the angle on the color wheel
    let angle = (index * increment) % 360;

    // If the index is odd, invert the angle to achieve the alternating pattern
    if (index % 2 !== 0) {
        angle = 360 - angle;
    }

    // Convert the angle to a HSL color with full saturation and lightness
    const color = hslToHex(angle, 100, 50);

    return color;
}

export function getAddressAsNumber(address: `0x${string}`): number {
    // Convert the address to a number by summing the ASCII values of each character
    return address.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

export function getAddressColor(address: `0x${string}`, maxColors: number): string {
    // Get the address as a number
    const addressNumber = getAddressAsNumber(address);

    // Calculate the index based on the maxColors
    const index = addressNumber % maxColors;

    // Get the color from the palette
    const color = getColorFromPalette(index, maxColors);

    return color;
}
