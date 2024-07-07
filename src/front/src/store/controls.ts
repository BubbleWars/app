import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { id } from "ethers";
import { ResourceType } from "../../../core/types/resource";

// Define a type for the slice state
interface ControlsState {
    hovered: string | null; //hovered entity id
    selected: string | null; //selected entity id
    aiming: {id: string, mass: number, type: ResourceType, isPortal:boolean} | null, //list of aiming entities and their mass
    emitting: {[id: string]: {id:string, mass: number, type: ResourceType, x: number, y: number}}; //list of emitting entities and their directions
    withdraw: boolean; //Widthdraw modal
    deposit: boolean; //Deposit modal
}

export const controlsSlice = createSlice({
    name: "controls",
    initialState: { 
        hovered: null,
        selected: null,
        aiming: null,
        emitting: {},
        withdraw: false,
        deposit: false,
     } as ControlsState,
    reducers: {
        setHovered: (state, action: PayloadAction<string | null>) => {
            state.hovered = action.payload;
        },
        setSelected: (state, action: PayloadAction<string | null>) => {
            state.selected = action.payload;
        },
        setAiming: (state, action: PayloadAction<{id: string, mass: number, type: ResourceType, isPortal: boolean}>) => {
           //console.log("setAiming", action.payload);
            state.aiming= {mass: action.payload.mass, type: action.payload.type, id: action.payload.id, isPortal: action.payload.isPortal};
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
        setWithdrawControlsActive: (state, action: PayloadAction<boolean>) => {
            state.withdraw = action.payload;
        },
        setDepositControlsActive: (state, action: PayloadAction<boolean>) => {
            state.deposit = action.payload;
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
    setWithdrawControlsActive,
    setDepositControlsActive,
} = controlsSlice.actions;

export default controlsSlice.reducer;
