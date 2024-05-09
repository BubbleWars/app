import { configureStore } from "@reduxjs/toolkit";
import { inputsSlice } from "./inputs";
import { interpolationSlice } from "./interpolation";
import { controlsSlice } from "./controls";

export default configureStore({
    reducer: {
        inputs: inputsSlice.reducer,
        interpolation: interpolationSlice.reducer,
        controls: controlsSlice.reducer,
    },
});
