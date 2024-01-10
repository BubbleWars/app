import { configureStore } from '@reduxjs/toolkit'
import { inputsSlice } from './inputs'

export default configureStore({
  reducer: {
    inputs: inputsSlice.reducer,
  }
})