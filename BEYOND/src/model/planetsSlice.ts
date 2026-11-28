/*
  Authored by Muhammad Shahwaiz Abbasi · 2026
  planetsSlice —> the planet catalogue, which planet is selected, the 3D view mode and the
  Grand Tour position.
 
  Contract with the 3D scene Hussein:
    - draw the planet whose id is selectedId as focused (null = solar-system overview)
    - when cameraNonce changes, fly back to the overview (even if selectedId was already null)
    - viewMode is visual (easy to navigate) or scale (true relative sizes)
  The scene reports clicks by calling a prop, the presenter dispatches visitPlanet(id).
 */

// Load the function that creates a slice.
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

// Load the list of planets from Person 2's data file.
import { PLANETS } from "../data/planets";

// Load the type of a planet.
import type { Planet } from "./types";

// The shape of this part of the state.
interface PlanetsState {
  catalogue: Planet[]; // The list of all planets.
  selectedId: string | null; // The id of the selected planet (null = none).
  cameraNonce: number; // A counter; when it changes the camera flies back to the overview.
  viewMode: "visual" | "scale"; // How the 3D scene is drawn.
  tour: { active: boolean; step: number }; // The Grand Tour: is it running, and at which step.
}

// The state at the start.
const initialState: PlanetsState = {
  catalogue: PLANETS as Planet[], // The list of all planets (Person 2's data).
  selectedId: null, // Nothing is selected.
  cameraNonce: 0, // The camera counter starts at 0.
  viewMode: "visual", // The easy-to-navigate mode.
  tour: { active: false, step: 0 }, // The tour is off and at step 0.
};

// Create the slice for the planets.
const planetsSlice = createSlice({
  name: "planets", // The name of this part of the state.
  initialState, // The start values.
  // The only functions allowed to change this part of the state.
  reducers: {
    // Select a planet.
    selectPlanet(state, action: PayloadAction<string | null>) {
      state.selectedId = action.payload; // Save the id of the planet.
    },

    // Remove the selection.
    clearSelection(state) {
      state.selectedId = null; // Nothing is selected.
    },

    // Close the selection AND make the camera return to the overview.
    resetView(state) {
      state.selectedId = null; // Nothing is selected.
      state.cameraNonce += 1; // Change the counter so the camera moves back.
    },

    // Change how the 3D scene is drawn.
    setViewMode(state, action: PayloadAction<"visual" | "scale">) {
      state.viewMode = action.payload; // Save the new mode.
    },

    // Start the Grand Tour at the first step.
    startTour(state) {
      state.tour = { active: true, step: 0 }; // The tour is on and at step 0.
    },

    // Go to a given step of the Grand Tour.
    setTourStep(state, action: PayloadAction<number>) {
      state.tour.step = action.payload; // Save the step number.
    },

    // Stop the Grand Tour.
    endTour(state) {
      state.tour.active = false; // The tour is off.
      state.selectedId = null; // Nothing is selected.
      state.cameraNonce += 1; // Change the counter so the camera moves back.
    },
  },
});

// Let other files use the action functions.
export const {
  selectPlanet,
  clearSelection,
  resetView,
  setViewMode,
  startTour,
  setTourStep,
  endTour,
} = planetsSlice.actions;

export default planetsSlice.reducer; // Let the store use the reducer.
