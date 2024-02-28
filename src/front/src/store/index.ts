import { configureStore } from "@reduxjs/toolkit";
import { inputsSlice } from "./inputs";
import { interpolationSlice } from "./interpolation";

export default configureStore({
    reducer: {
        inputs: inputsSlice.reducer,
        interpolation: interpolationSlice.reducer,
    },
});
