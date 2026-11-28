/*
  Authored by Muhammad Shahwaiz Abbasi · 2026
  comparisonSlice —> which two planets are shown on the Compare page. 
*/

// Load the function that creates a slice and the type of an action with data.
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

// The shape of this part of the state.
interface ComparisonState {
  ids: string[]; // The ids of the two planets being compared.
}

// The state at the start: Earth and Mars.
const initialState: ComparisonState = { ids: ["earth", "mars"] };

// Create the slice for the comparison.
const comparisonSlice = createSlice({
  name: "comparison", // The name of this part of the state.
  initialState, // The start values.
  // The only functions allowed to change this part of the state.
  reducers: {
    // Choose which two planets to compare.
    setComparison(state, action: PayloadAction<string[]>) {
      state.ids = action.payload; // Store the two planet ids.
    },
    // Switch the first and the second planet.
    swapComparison(state) {
      state.ids = [state.ids[1], state.ids[0]]; // Put the second id first and the first id second.
    },
  },
});

// Let other files use the action functions.
export const { setComparison, swapComparison } = comparisonSlice.actions;
export default comparisonSlice.reducer; // Let the store use the reducer.
