import { Color } from "three";

export function darkenColor(colorHex: string, amount: number): string {
    const color = new Color(colorHex);
    color.multiplyScalar(1 - amount); // Darken the color by a certain amount
    return `#${color.getHexString()}`; // Convert back to hex string
}

export function lightenColor(colorHex: string, amount: number): string {
    const color = new Color(colorHex);
    const white = new Color(0xffffff); // White color
    color.lerp(white, amount); // Lighten the color by interpolating it towards white
    return `#${color.getHexString()}`; // Convert back to hex string
}