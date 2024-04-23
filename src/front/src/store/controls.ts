import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { id } from "ethers";
import { ResourceType } from "../../../core/types/resource";

// Define a type for the slice state
interface ControlsState {
    hovered: string | null; //hovered entity id
    selected: string | null; //selected entity id
    aiming: {[id: string]: {mass: number, type: ResourceType}}, //list of aiming entities and their mass
    emitting: {[id: string]: {mass: number, type: ResourceType, x: number, y: number}}; //list of emitting entities and their directions
}

export const controlsState = createSlice({
    name: "controls",
    initialState: { 
        hovered: null,
        selected: null,
        emitting: {}
     } as ControlsState,
    reducers: {
        setHovered: (state, action: PayloadAction<string | null>) => {
            state.hovered = action.payload;
        },
        setSelected: (state, action: PayloadAction<string | null>) => {
            state.selected = action.payload;
        },
        setAiming: (state, action: PayloadAction<{id: string, mass: number, type: ResourceType}>) => {
            state.aiming[action.payload.id] = {mass: action.payload.mass, type: action.payload.type};
        },
        setEmitting: (state, action: PayloadAction<{id: string, mass: number, type: ResourceType, x: number, y: number}>) => {
            state.emitting[action.payload.id] = {mass: action.payload.mass, type: action.payload.type, x: action.payload.x, y: action.payload.y};
        }
    },
});

// Action creators are generated for each case reducer function
export const {
    setHovered,
    setSelected,
    setEmitting
} = controlsState.actions;

export default controlsState.reducer;
