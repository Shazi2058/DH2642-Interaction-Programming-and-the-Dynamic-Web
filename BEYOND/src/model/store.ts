/*
  Authored by Muhammad Shahwaiz Abbasi · 2026 
  store.ts —> creates the single Redux store (the "Application State").

  Each key is one slice of state; open the slice file to see its data and the small
  functions (reducers) that are the only code allowed to change it.

  The listener middleware carries the side effects (saving to the database, toast timers).

  This file also exports the TypeScript types of the whole state (RootState), of dispatch
  (AppDispatch) and of a thunk (AppThunk), which the rest of the app imports.
 */

// Load the function that combines reducers, the function that creates the store, and the type of a thunk.
import {
  combineReducers, // Combines the slice reducers into one.
  configureStore, // Creates the store.
  type UnknownAction, // The type of an action.
  type ThunkAction, // The type of a thunk.
} from "@reduxjs/toolkit";

import planets from "./planetsSlice"; // Load the reducer for planets, the selected planet, view mode and Grand Tour.
import discovery from "./discoverySlice"; // Load the reducer for NASA data.
import user from "./userSlice"; // Load the reducer for the user and the preferences.
import collection from "./collectionSlice"; // Load the reducer for saved items (My Universe).
import progress from "./progressSlice"; // Load the reducer for points, history, achievements and searches.
import comparison from "./comparisonSlice"; // Load the reducer for the two planets being compared.
import ui from "./uiSlice"; // Load the reducer for toasts, the image viewer and the intro.
import { sideEffects } from "./sideEffects"; // Load the side effects (saving to the database, toast timers).

// Combine all the reducers; each key becomes a part of the state.
const rootReducer = combineReducers({
  planets,
  discovery,
  user,
  collection,
  progress,
  comparison,
  ui,
});

// The type of the whole state, worked out from the reducers.
export type RootState = ReturnType<typeof rootReducer>;

// Create the store and share it with the app.
export const store = configureStore({
  // Use the combined reducer.
  reducer: rootReducer,
  // Add our side effects in front of the default middleware.
  middleware: (getDefaultMiddleware) =>
    // Put the side-effect middleware first.
    getDefaultMiddleware().prepend(sideEffects.middleware),
});

// The type of the dispatch function (it accepts actions and thunks).
export type AppDispatch = typeof store.dispatch;

// The type of a thunk: a function that gets dispatch and getState, and may return something.
export type AppThunk<ReturnValue = void> = ThunkAction<
  ReturnValue,
  RootState,
  unknown,
  UnknownAction
>;
