import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Input } from '../../../core/types/inputs';
import { Snapshot } from '../../../core/types/state';

// Define a type for the slice state
interface InterpolationState {
  from: number | null;
  isBubbleSelected: boolean;
  selectedEntityId: string | null;
  pan: { x: number, y: number } | null;
  lock: string | null; //lock the camera to a specific entity
}

export const interpolationSlice = createSlice({
  name: 'inputs',
  initialState: { from: null } as InterpolationState,
  reducers: {
    setLock: (state, action: PayloadAction<string | null>) => {
        state.lock = action.payload;
    },
    setPan: (state, action: PayloadAction<{x: number, y: number} | null>) => {
        state.pan = action.payload;
    },
    setSelectedEntityId: (state, action: PayloadAction<string | null>) => {
     //console.log("setSelectedEntityId", action.payload)
        state.selectedEntityId = action.payload;
    },
    setIsBubbleSelected: (state, action: PayloadAction<boolean>) => {
     //console.log("setIsBubbleSelected", action.payload)
        state.isBubbleSelected = action.payload;
    },
    setInterpolation: (state, action: PayloadAction<number>) => {
        state.from = action.payload;
    },
    endInterpolation: (state) => {
        state.from = null;
    },
    interpolate: (state, action: PayloadAction<{step: number, end: number}>) => {
        //set new from value by incrementing the current from value
        //if greater than the end value, set to null
        state.from = state.from ? state.from + action.payload.step : null;
        if (state.from && state.from > action.payload.end) state.from = null;
    }
    // You can add more reducer functions here as needed
  },
});

// Action creators are generated for each case reducer function
export const { setInterpolation, endInterpolation, interpolate, setIsBubbleSelected, setSelectedEntityId, setPan, setLock } = interpolationSlice.actions;

export default interpolationSlice.reducer;
