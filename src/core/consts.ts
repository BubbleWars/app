export const WORLD_WIDTH = 100;
export const WORLD_HEIGHT = 100;
export const GRAVITATIONAL_CONSTANT = 0.00001; // 6.67e-11
export const MASS_PER_SECOND = 100000000000; // 0.001 ETH per second
export const STEP_DELTA = 1 / 60;
export const MAX_ADVANCE_STATE_TIME = 500;
export const MIN_MASS = 0.000001;
export const EMISSION_SPEED = 0.08;
export const DAMPENING = 0.01;
export const ENERGY_NODE_COUNT = 100;

//The amount of energy in each bubble is calculated according to E=mc^2 * MASS_ENERGY_CONVERSION_EFFICIENCY
//This refers to the efficiency of converting the Total possible energy within the bubble to the energy that can be used by the user
export const MASS_ENERGY_CONVERSION_EFFICIENCY  =  13.969 * Math.pow(10, -9); //4.6e-11
export const C = 3 * Math.pow(10, 8); //Speed of light in m/s
export const MAX_VELOCITY = 1.3;
export const CLASH_KE = 0.0001;
export const PLANCK_MASS = 0.001; 
export const MIN_DELTA_VELOCITY = 0.1;