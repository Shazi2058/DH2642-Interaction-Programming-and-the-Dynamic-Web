/*
  Authored by Muhammad Shahwaiz Abbasi · 2026
  userSlice —> who is signed in, the state of the sign-in form and the user's preferences.
 
  use is null for a visitor who is not signed in. status stays loading until Firebase
  has told us either way, so the app never flashes the wrong screen.

  Signing in and out happens in model/thunks.ts. The user arrives here via model/startup.ts.
 */

import { createSlice, type PayloadAction } from "@reduxjs/toolkit"; // Load the function that creates a slice.
import type { AppUser, AuthMode, Preferences } from "./types"; // Load the types of our own data.

// The shape of this part of the state.
interface UserState {
  user: AppUser | null; // The signed-in user or null.
  status: "loading" | "ready"; // Do we know yet if someone is signed in?
  mode: AuthMode; // Which mode we run in.
  busy: boolean; // True while a sign-in request is running.
  error: string | null; // The error message for the sign-in form.
  preferences: Preferences; // The user's settings.
}

// The settings a new user starts with (Default Settings).
export const DEFAULT_PREFERENCES: Preferences = {
  motion: "system", // Motion: 'system' follows the device, 'full' always animates, 'reduce' calms the app.
  temperatureUnit: "C", // Show temperatures in Celsius ('C') or Fahrenheit ('F').
  showLabels: true, // Show planet names in the 3D scene.
};

// The state at the start.
const initialState: UserState = {
  user: null, // Nobody is signed in at the start.
  status: "loading", // We do not know yet if someone is signed in.
  mode: "firebase", // Which mode we run in? firebase or local.
  busy: false, // True while a sign-in request is running.
  error: null, // The error message for the sign-in form.
  preferences: DEFAULT_PREFERENCES, // The user's settings.
};

// Create the slice for the user.
const userSlice = createSlice({
  name: "user", // The name of this part of the state.
  initialState, // The start values.
  // The only functions allowed to change this part of the state.
  reducers: {
    // Store who is signed in (or null) and say we now know.
    setUser(state, action: PayloadAction<AppUser | null>) {
      state.user = action.payload; // Save the user.
      state.status = "ready"; // We now know the answer.
    },

    // Store the mode we run in.
    setAuthMode(state, action: PayloadAction<AuthMode>) {
      state.mode = action.payload; // Save the mode.
    },

    // A sign-in request started.
    authStarted(state) {
      state.busy = true; // Show that we are busy.
      state.error = null; // Remove the old error message.
    },

    // A sign-in request ended well.
    authFinished(state) {
      state.busy = false; // We are not busy any more.
    },

    // A sign-in request failed.
    authFailed(state, action: PayloadAction<string>) {
      state.busy = false; // We are not busy any more.
      state.error = action.payload; // Save the message to show.
    },

    // Remove the error message.
    clearAuthError(state) {
      state.error = null; // No error any more.
    },

    // The user changed a setting.
    setPreferences(state, action: PayloadAction<Partial<Preferences>>) {
      state.preferences = { ...state.preferences, ...action.payload }; // Keep the old settings and replace only the changed ones.
    },

    // Preferences arrived from the database (null means use the defaults).
    loadPreferences(state, action: PayloadAction<Partial<Preferences> | null>) {
      state.preferences = { ...DEFAULT_PREFERENCES, ...action.payload }; // Start from the defaults and add the saved settings.
    },
  },
});

// Let other files use the action functions.
export const {
  setUser, // Share the "setUser" function.
  setAuthMode, // Share the "setAuthMode" function.
  authStarted, // Share the "authStarted" function.
  authFinished, // Share the "authFinished" function.
  authFailed, // Share the "authFailed" function.
  clearAuthError, // Share the "clearAuthError" function.
  setPreferences, // Share the "setPreferences" function.
  loadPreferences, // Share the "loadPreferences" function.
} = userSlice.actions; // Take these action functions out of the slice.

export default userSlice.reducer; // Let the store use the reducer.
