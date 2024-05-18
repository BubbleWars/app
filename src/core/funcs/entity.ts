import { Attractor } from "../types/entity";

export const addAttractor = (
    attractors: Attractor[],
    {to, from}: Attractor
) => {
    return attractors.push({to, from});
}