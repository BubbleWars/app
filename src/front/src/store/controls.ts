import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { id } from "ethers";
import { ResourceType } from "../../../core/types/resource";

// Define a type for the slice state
interface ControlsState {
    hovered: string | null; //hovered entity id
    selected: string | null; //selected entity id
    aiming: {id: string, mass: number, type: ResourceType} | null, //list of aiming entities and their mass
    emitting: {[id: string]: {id:string, mass: number, type: ResourceType, x: number, y: number}}; //list of emitting entities and their directions
}

export const controlsSlice = createSlice({
    name: "controls",
    initialState: { 
        hovered: null,
        selected: null,
        aiming: null,
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
            state.aiming= {mass: action.payload.mass, type: action.payload.type, id: action.payload.id};
        },
        setEmitting: (state, action: PayloadAction<{id: string, mass: number, type: ResourceType, x: number, y: number}>) => {
            state.emitting[action.payload.id] = {id:action.payload.id, mass: action.payload.mass, type: action.payload.type, x: action.payload.x, y: action.payload.y};
        },
        clearAiming: (state) => {
            state.aiming = null
        },
        clearEmitting: (state, action: PayloadAction<string>) => {
            delete state.emitting[action.payload];
        },
        clearAllEmitting: (state) => {
            state.emitting = {};
        },
    },
});

// Action creators are generated for each case reducer function
export const {
    setHovered,
    setSelected,
    setEmitting,
    setAiming,
    clearAiming,
    clearEmitting,
    clearAllEmitting,
} = controlsSlice.actions;

export default controlsSlice.reducer;
