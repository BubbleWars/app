import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Input } from '../../../core/types/inputs';

// Define a type for the slice state
interface InputsState {
  inputs: Input[];
}

export const inputsSlice = createSlice({
  name: 'inputs',
  initialState: { inputs: [] } as InputsState,
  reducers: {
    setInputs: (state, action: PayloadAction<Input[]>) => {
      action.payload.forEach(input => {
        // Check if input is already in the state using a unique identifier
        const isInputExists = state.inputs.some(stateInput =>
          stateInput.timestamp === input.timestamp && stateInput.sender === input.sender // Example combination
        );
        if (!isInputExists) {
          state.inputs.push(input);
        }
      });
    },
    addInput: (state, action: PayloadAction<Input>) => {
        const isInputExists = state.inputs.some(stateInput =>
            stateInput.timestamp === action.payload.timestamp && stateInput.sender === action.payload.sender // Example combination
        );
        if (!isInputExists) {
            state.inputs.push(action.payload);
        }
    }
    // You can add more reducer functions here as needed
  },
});

// Action creators are generated for each case reducer function
export const { setInputs, addInput } = inputsSlice.actions;

export default inputsSlice.reducer;
