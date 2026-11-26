/*
  Authored by Muhammad Shahwaiz Abbasi · 2026
  uiSlice —> small app-wide interface state. Pop-up messages (toasts), the full-screen image
  viewer and whether the intro has been seen.
 
  Toasts remove themselves, a side effect in model/sideEffects.ts dismisses each one after its
  duration (ms). Use duration, 0 for a toast that stays until dismissed.
 */

import { createSlice, nanoid, type PayloadAction } from "@reduxjs/toolkit"; // Load the function that creates a slice and the function that makes unique ids.
import type { NasaImage, Toast, ToastInput } from "./types"; // Load the types of our own data.

// The shape of this part of the state.
interface UiState {
  toasts: Toast[]; // The pop-up messages that are shown.
  viewer: NasaImage | null; // The image shown large, or null.
  introSeen: boolean; // True once the intro has been seen.
}

// The state at the start: no toasts, no viewer, intro not seen.
const initialState: UiState = { toasts: [], viewer: null, introSeen: false };

// Create the slice for the interface state.
const uiSlice = createSlice({
  name: "ui", // The name of this part of the state.
  initialState, // The start values.
  // The only functions allowed to change this part of the state.
  reducers: {
    // Show a new pop-up message.
    pushToast: {
      // prepare runs first. It adds the unique id and default values.
      prepare: (toast: ToastInput) => ({
        // Build the data that goes into the reducer.
        payload: {
          id: nanoid(),
          kind: "info",
          duration: 4500,
          ...toast,
        } as Toast,
      }),

      // Add the prepared toast to the list.
      reducer(state, action: PayloadAction<Toast>) {
        state.toasts.push(action.payload); // Put the toast at the end of the list.
      },
    },

    // Remove one pop-up message.
    dismissToast(state, action: PayloadAction<string>) {
      // Keep every toast except the one with this id.
      state.toasts = state.toasts.filter(
        (toast) => toast.id !== action.payload,
      );
    },

    // Remember if the intro has been seen.
    setIntroSeen(state, action: PayloadAction<boolean>) {
      state.introSeen = action.payload; // Store true or false.
    },

    // Open the big image viewer.
    openViewer(state, action: PayloadAction<NasaImage>) {
      state.viewer = action.payload; // Store the image to show large.
    },

    // Close the big image viewer.
    closeViewer(state) {
      state.viewer = null; // Nothing to show any more.
    },
  },
});

// Let other files use the action functions.
export const {
  pushToast,
  dismissToast,
  setIntroSeen,
  openViewer,
  closeViewer,
} = uiSlice.actions; // Take the action functions out of the slice.

export default uiSlice.reducer; // Let the store use the reducer.
